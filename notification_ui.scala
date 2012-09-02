import com.trolltech.qt.core._
import com.trolltech.qt.gui._
import com.trolltech.qt.webkit._
import java.awt.Desktop
import java.io.File
import java.net.URI

import org.java_websocket.client.WebSocketClient
import org.java_websocket.handshake.ServerHandshake

import com.trolltech.qt.QSignalEmitter._

object NotificaionUI {
  def browse(url: String) = {
    try {
      val desktop = Desktop.getDesktop
      desktop.browse(new URI(url))
    }
    catch {
      case e ⇒ e.printStackTrace
    }
  }

  class TopWindow extends QWebView {
    val bridge = new QObject {
      def func() = {
        println("func called")
      }

      def setVisible(visible: Boolean) = {
        // println("visible = " + visible)
        if (visible) {
          TopWindow.this.show()
        }
        else {
          TopWindow.this.hide()
        }
      }
    }

    var websocket: WebSocket = null
    class WebSocket extends JWebSocket {
      import QEvent.Type

      var map: Map[String, WebSocketClient] = Map()
      val jws = this

      case class OpenEvent(uri: String) extends QEvent(Type.CustomEnum)
      case class MessageEvent(uri: String,
        msg: String) extends QEvent(Type.CustomEnum)
      case class CloseEvent(uri: String, code: Int, reason: String,
        remote: Boolean) extends QEvent(Type.CustomEnum)
      case class ErrorEvent(uri: String, ex: String)
           extends QEvent(Type.CustomEnum)

      def create(uri: String): String = this.synchronized {
        val ws = new WebSocketClient(new URI(uri)) {
          def onMessage(msg: String): Unit = {
            QCoreApplication.postEvent(jws, MessageEvent(uri, msg))
          }

          def onOpen(h: ServerHandshake): Unit = {
            QCoreApplication.postEvent(jws, OpenEvent(uri))
          }

          def onClose(code: Int, reason: String, remote: Boolean): Unit = {
            QCoreApplication.postEvent(
              jws,
              CloseEvent(uri, code, reason, remote)
            )
          }

          def onError(ex: Exception): Unit = {
            QCoreApplication.postEvent(jws, ErrorEvent(uri, ex.toString))
          }
        }

        map.get(uri) match {
          case Some(ws) ⇒ ws.close()
          case _ ⇒
        }

        map += uri → ws
        ws.connect

        uri
      }

      def send(uri: String, data: String): Boolean = this.synchronized {
        map.get(uri) match {
          case Some(ws) ⇒ ws.send(data); true
          case _ ⇒ false
        }
      }

      def close(uri: String): Boolean = this.synchronized {
        map.get(uri) match {
          case Some(ws) ⇒ {
            ws.close()
            map -= uri
            true
          }
          case _ ⇒ {
            false
          }
        }
      }

      override def eventFilter(o: QObject, e: QEvent) = {
        e match {
          case OpenEvent(uri) ⇒ onOpen.emit(uri)
          case MessageEvent(uri, msg) ⇒ onMessage.emit(uri, msg)
          case CloseEvent(uri, code, reason, remote) ⇒
            onClose.emit(uri, code, reason, remote)
          case ErrorEvent(uri, ex) ⇒ onError.emit(uri, ex)
          case _ ⇒
        }

        super.eventFilter(o, e)
      }

      installEventFilter(this)

      def cleanUp() = {
        removeEventFilter(this)
        map.foreach(kv => kv._2.close())
        map = Map()
      }
    }

    val console = new QObject {
      def log(str: String) = {
        System.err.println(str)
        System.err.flush()
      }
    }

    // top window
    setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
    setAttribute(Qt.WidgetAttribute.WA_X11NetWmWindowTypeNotification)
    setWindowFlags(
      Qt.WindowType.FramelessWindowHint,
      Qt.WindowType.WindowStaysOnTopHint,
      Qt.WindowType.WindowShadeButtonHint,
      Qt.WindowType.X11BypassWindowManagerHint
    )
    // for widget
    setAttribute(Qt.WidgetAttribute.WA_OpaquePaintEvent, false);
    setStyleSheet("background:transparent;");

    // signal
    // for window.resize
    page.geometryChangeRequested.connect(this, "onResize(QRect)")
    // for link click
    page.setLinkDelegationPolicy(
      QWebPage.LinkDelegationPolicy.DelegateAllLinks
    )
    page.linkClicked.connect(this, "onLinkClicked(QUrl)")
    // load
    loadFinished.connect(this, "show()")
    // for bridge
    page.mainFrame.javaScriptWindowObjectCleared.connect(
      this, "setWindowObject()"
    )

    // size
    setGeometry(new QRect(0, 0, 100, 100));

    // title
    setWindowTitle("Qtjambi Notificaion")

    // override close
    override def closeEvent(e: QCloseEvent) = {
      println("ignore close event " + e)
      // e.accept()
      e.ignore()
    }

    // event handler
    def onResize(rect: QRect) = {
      //println("qrect = " + rect)
      setGeometry(rect)
    }

    def onLinkClicked(url: QUrl) = {
      println("url clicked: " + url)
      url.scheme match {
        case "http" | "https" ⇒ browse(url.toString)
        case _ ⇒
      }
    }

    def setWindowObject() = {
      page.mainFrame.addToJavaScriptWindowObject("bridge", bridge)
      page.mainFrame.addToJavaScriptWindowObject("console", console)
      if (websocket != null) {
        websocket.cleanUp()
        // NOTE: below will casue print
        // QCoreApplication::postEvent: Unexpected null receiver
        // ErrorEvent & CloseEvent each time.
        websocket.dispose()
      }
      websocket = new WebSocket()
      page.mainFrame.addToJavaScriptWindowObject("websocket", websocket)
    }
  }


  def main(args: Array[String]): Unit = {
    val app = new QApplication(args)

    val win = new TopWindow
    if (args.size == 0)
      win.load(new QUrl((new File("index.html")).toURI.toString))
    else
      win.load(new QUrl(args(0)))

    app.exec()
  }
}

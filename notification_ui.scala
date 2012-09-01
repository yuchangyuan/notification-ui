import com.trolltech.qt.core._
import com.trolltech.qt.gui._
import com.trolltech.qt.webkit._
import java.awt.Desktop
import java.io.File
import java.net.URI

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

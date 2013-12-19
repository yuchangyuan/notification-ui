
#include <QtGui>
//#include <QtWebKit>

// for qt5
#include <QtWidgets>
#include <QtWebKitWidgets>

#include <iostream>
#include "mainwindow.h"


#ifdef Q_OS_MAC
#include <objc/objc-runtime.h>
#endif

MainWindow::MainWindow()
    : QWebView()
{
    // set window
    setAttribute((Qt::WidgetAttribute)(Qt::WA_TranslucentBackground |
                                       Qt::WA_MacAlwaysShowToolWindow));

    setWindowFlags(Qt::FramelessWindowHint |
                   Qt::WindowShadeButtonHint |
                   Qt::WindowStaysOnTopHint |
                   Qt::Drawer);

#ifdef Q_OS_MAC
    // make window sticky on mac os x
    // keep-a-application-window-always-on-current-desktop-on-linux-and-mac
    // on stackoverflow
    WId windowObject = this->winId();
    objc_object * nsviewObject =
        reinterpret_cast<objc_object *>(windowObject);
    objc_object * nsWindowObject =
        objc_msgSend(nsviewObject, sel_registerName("window"));

    int NSWindowCollectionBehaviorCanJoinAllSpaces = 1 << 0;
    objc_msgSend(nsWindowObject,
                 sel_registerName("setCollectionBehavior:"),
                 NSWindowCollectionBehaviorCanJoinAllSpaces);
#endif

    connect(this, SIGNAL(loadFinished(bool)), SLOT(finishLoading(bool)));
    connect(this->page(), SIGNAL(geometryChangeRequested(const QRect &)),
            SLOT(geometryChange(const QRect &)));

    //resize(430, 400);
    setGeometry(QRect(400, 10, 430, 400));

    // for widget
    setAttribute(Qt::WA_OpaquePaintEvent, false);
    //setStyleSheet("background:transparent;");
    //setStyleSheet("background:rgba(255,255,255,0);");
    setStyleSheet("background:rgba(255,255,255,0.01);"); // hack
    setRenderHints(QPainter::TextAntialiasing);
}

void MainWindow::finishLoading(bool)
{
    this->show();
}

void MainWindow::geometryChange(const QRect &geom)
{
    setGeometry(geom);
}

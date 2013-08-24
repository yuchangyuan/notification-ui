
#include <QtGui>
//#include <QtWebKit>

// for qt5
#include <QtWidgets>
#include <QtWebKitWidgets>

#include <iostream>
#include "mainwindow.h"

MainWindow::MainWindow()
  : QWebView()
{
  // set window
  setAttribute(Qt::WA_TranslucentBackground |
               Qt::WA_MacAlwaysShowToolWindow);

  setWindowFlags(Qt::FramelessWindowHint |
                 Qt::WindowShadeButtonHint |
                 Qt::WindowStaysOnTopHint |
                 Qt::ToolTip);

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

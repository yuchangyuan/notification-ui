#ifndef _MAINWINDOW_H_
#define _MAINWINDOW_H_

// #include <QtWebKit>
// for qt5
#include <QtWebKitWidgets>
#include <QTimer>
#include "bridge.h"

class MainWindow : public QWebView
{
    Q_OBJECT

    Bridge *bridge;
    QTimer *timer;
public:
    MainWindow();
    ~MainWindow();

protected slots:
    void finishLoading(bool);
    void geometryChange(const QRect &);
    void tick();
    //void keyPressEvent(QKeyEvent *);
    //void focusInEvent(QFocusEvent *);
    //void focusOutEvent(QFocusEvent *);
private:
};

#endif

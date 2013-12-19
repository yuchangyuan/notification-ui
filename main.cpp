#include <QtGui>

// for qt5
#include <QtWidgets>

#include "mainwindow.h"

int main(int argc, char * argv[])
{
    QApplication app(argc, argv);
    QUrl url;

    if (argc > 1)
        url = QUrl(argv[1]);
    else {
#ifdef Q_OS_MAC
        url = QUrl::fromLocalFile(QCoreApplication::applicationDirPath() +
                                  "/../Resources/html/index.html");
#else
        url = QUrl("http://www.google.com/ncr");
#endif
    }
    // qDebug() << url;

    MainWindow *browser = new MainWindow();
    browser->load(url);

    return app.exec();
}


// #include <QtWebKit>
// for qt5
#include <QtWebKitWidgets>
#include "bridge.h"

class MainWindow : public QWebView
{
    Q_OBJECT

    Bridge *bridge;

public:
    MainWindow();
    ~MainWindow();

protected slots:
    void finishLoading(bool);
    void geometryChange(const QRect &);

private:
};

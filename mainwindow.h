
// #include <QtWebKit>
// for qt5
#include <QtWebKitWidgets>

class MainWindow : public QWebView
{
    Q_OBJECT

public:
    MainWindow();

protected slots:
    void finishLoading(bool);
    void geometryChange(const QRect &);

private:
};

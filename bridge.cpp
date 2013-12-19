#include "bridge.h"

Bridge::Bridge(QWidget *w) : QObject()
{
    top = w;
}

Q_INVOKABLE void Bridge::setVisible(bool visible) {
    if (visible) top->show();
    else top->hide();
}

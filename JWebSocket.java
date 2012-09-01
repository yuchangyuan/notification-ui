import com.trolltech.qt.core.QObject;
import com.trolltech.qt.core.QObject;
import static com.trolltech.qt.QSignalEmitter.*;

class JWebSocket extends QObject {
    public Signal1<String> onOpen = new Signal1<String>();
    public Signal2<String, String> onMessage = new Signal2<String, String>();
    public Signal4<String, Integer, String, Boolean> onClose =
        new Signal4<String, Integer, String, Boolean>();
    public Signal2<String, String> onError = new Signal2<String, String>();
}

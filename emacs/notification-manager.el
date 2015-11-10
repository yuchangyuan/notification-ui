;;; notification-manager.el --- Manager notifications for notification-server

;; Copyright (C) 2015  Yu Changyuan

;; Author: Yu Changyuan <reivzy@gmail.com>
;; Keywords: comm

;; This program is free software; you can redistribute it and/or modify
;; it under the terms of the GNU General Public License as published by
;; the Free Software Foundation, either version 3 of the License, or
;; (at your option) any later version.

;; This program is distributed in the hope that it will be useful,
;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
;; GNU General Public License for more details.

;; You should have received a copy of the GNU General Public License
;; along with this program.  If not, see <http://www.gnu.org/licenses/>.

;;; Commentary:

;;

;;; Code:

(require 'websocket)
(require 'json)
(require 'shr)

(defgroup notification-manager nil
  "Notification manager group."
  :group 'emacs)

;; ------- faces -----------

(defface notification-manager-hide-face
  '((default (:foreground "#888")))
  "face for hide something."
  :group 'notification-manager)

(defface notification-manager-summary-face
  `((default (:inherit font-lock-keyword-face)))
  "face for summary."
  :group 'notification-manager)

(defface notification-manager-body-face
  `((default (:inherit default)))
  "face for body."
  :group 'notification-manager)

(defface notification-manager-client-face
  `((default (:inherit font-lock-variable-name-face)))
  "face for client."
  :group 'notification-manager)

(defface notification-manager-url-face
  `((default (:inherit font-lock-constant-face)))
  "face for url."
  :group 'notification-manager)

(defface notification-manager-timestamp-face
  `((default (:inherit font-lock-constant-face)))
  "face for timestamp."
  :group 'notification-manager)

(defface notification-manager-timeout-face
  `((default (:inherit font-lock-warning-face)))
  "face for timeout."
  :group 'notification-manager)

(defcustom notification-manager-normal-urgency-background
  "#112"
  "Background from normal notifications")

(defcustom notification-manager-low-urgency-background
  "#222"
  "Background from low urgency notifications")

(defcustom notification-manager-critical-urgency-background
  "#311"
  "Background from low urgency notifications")

(defvar notification-manager-mode-hook nil)

(defvar notification-manager-mode-map
  (let ((map (make-keymap)))
    (define-key map "n" 'next-line)
    (define-key map "p" 'previous-line)
    (define-key map "N" 'notification-manager-nav-next-block)
    (define-key map "P" 'notification-manager-nav-prev-block)
    (define-key map "q" 'bury-buffer)
    map)
  "keymap for notification-manager-mode")

(make-local-variable
 (defvar notification-manager-sock-ui nil
   "Websocket for UI"))

(make-local-variable
 (defvar notification-manager-sock-client nil
   "Websocket for Client"))

(defun notification-manager-buffer-base-name (url)
  "Buffer name without '*' for `url'"
  (let* ((u (url-generic-parse-url url))
         (n (format "%s://%s:%d"
                    (url-type u)
                    (url-host u)
                    (url-port u))))
    (format "notification-manager %s" n)))

(defun notification-manager-buffer-name (url)
  "Buffer name for `url'"
  (format "*%s*" (notification-manager-buffer-base-name url)))

(defun notification-manager-log-buffer-name (url)
  "Log buffer name for `url'"
  (format "*%s|log*" (notification-manager-buffer-base-name url)))

(defun notification-manager-log (url msg)
  "Log message for debug."
  (with-current-buffer (get-buffer-create
                        (notification-manager-log-buffer-name url))
    (save-excursion
        (goto-char (point-max))
        (setq buffer-read-only nil)
        (insert (format "%S" msg))
        (insert "\n")
        (setq buffer-read-only t))))

;; -------- utils
(defun notification-manager-timestamp-to-time (ts)
  (let* ((a (/ ts 1000))
         (b (mod ts 1000)))
    (list (/ a 65536) (mod a 65536) (* b 1000) 0)))

(defun notification-manager-timestamp-to-string (ts)
  (format-time-string "%F %T.%3N%z"
                      (notification-manager-timestamp-to-time ts)))

(defconst notification-manager-uuid-regexp
  (concat "\\([0-9a-f]\\)\\{8\\}-"
          "\\([0-9a-f]\\)\\{4\\}-"
          "\\([0-9a-f]\\)\\{4\\}-"
          "\\([0-9a-f]\\)\\{4\\}-"
          "\\([0-9a-f]\\)\\{12\\}"))

;; NOTE: we should as as less text properties as possible
(defun notification-manager-set-background (begin end bg)
  "Update background."
  (let ((p0 (point)) p1 f1)
    (goto-char begin)
    (while (and (< (point) end)
                (not (eq (point) (point-max))))
      (let* ((p (point))
             (f (get-text-property p 'face))
             f2)
        (if (null f) (setq f2 `(:background ,bg))
          (setq f2 `((:background ,bg) ,f)))
        (unless f1 (setq f1 f2))
        (unless p1 (setq p1 p))
        (unless (equal f1 f2)
          (add-text-properties p1 p `(face ,f1))
          (setq p1 p)
          (setq f1 f2)))
      (forward-char))
    (add-text-properties p1 (point) `(face ,f1))
    (goto-char p0)))

(defun notification-manager-insert-html (str)
  "Insert html `str' with `shr-insert-document'"
  (let ((doc (with-temp-buffer
               (insert str)
               (libxml-parse-html-region (point-min) (point-max)))))
    (shr-insert-document doc)))

(defun notification-manager-get-background (msg)
  (let ((c (cdr (assoc 'notification_class msg)))
        (bg notification-manager-normal-urgency-background))
    (dotimes (i (length c))
      (cond ((equal (elt c i) "low-urgency")
             (setq bg notification-manager-low-urgency-background))
            ((equal (elt c i) "critical-urgency")
             (setq bg notification-manager-critical-urgency-background))))
    bg))

;; -------------- navigation
(defun notification-manager-nav-goto (uuid)
  (and (re-search-backward (format "^%s" uuid)
                           (point-min)
                           t)
       (eq (get-text-property (point) 'mark) 'uuid))
  )

(defun notification-manager-nav-next-block1 ()
  (while (and (forward-line 1)
              (re-search-forward notification-manager-uuid-regexp
                                 (point-max) t)
              (forward-line 0)
              (not (eq (get-text-property (point) 'mark) 'uuid))))
  (eq (get-text-property (point) 'mark) 'uuid))

(defun notification-manager-nav-next-block ()
  (interactive)
  (or (notification-manager-nav-next-block1)
      (progn (goto-char (point-max))
             (forward-line 0))))

(defun notification-manager-nav-prev-block1 ()
  (while (and (eq (forward-line -1) 0)
              (re-search-backward notification-manager-uuid-regexp
                                  (point-min) t)
              (forward-line 0)
              (not (eq (get-text-property (point) 'mark) 'uuid))))
  (eq (get-text-property (point) 'mark) 'uuid))

(defun notification-manager-nav-prev-block ()
  (interactive)
  (or (notification-manager-nav-prev-block1)
      (goto-char (point-min))))

;; -------- edit
(defun notification-manager-do-create (url msg)
  ;; -----------------------
  ;; history area
  ;; -----------------------
  ;; active area
  ;; -----------------------
  ;; edit area
  ;; -----------------------
  (let ((title (cdr (assoc 'title msg)))
        (body  (cdr (assoc 'body msg)))
        (timeout (cdr (assoc 'timeout msg)))
        (client (cdr (assoc 'client msg)))
        (uuid (cdr (assoc 'uuid msg)))
        (timestamp (cdr (assoc 'timestamp msg)))
        (bg (notification-manager-get-background msg))
        p0 p1 p2)
    (goto-char (point-max))
    (setq p1 (point))
    ;; uuid
    (setq p0 (point))
    (insert uuid)
    (set-text-properties p0 (point)
                         '(face notification-manager-hide-face mark uuid))
    (insert " ")
    ;; timeout
    (setq p0 (point))
    (insert (format "%d" timeout))
    (set-text-properties p0 (point)
                         '(face notification-manager-timeout-face))
    (insert "\n")
    ;; ---
    (setq p0 (point))
    (insert "---\n")
    (set-text-properties p0 (point)
                         '(face notification-manager-hide-face mark status))
    ;; summary
    (setq p0 (point))
    (notification-manager-insert-html title)
    (add-text-properties p0 (point) '(face notification-manager-summary-face))
    (insert "\n")
    ;; ---
    (setq p0 (point))
    (insert "---\n")
    (set-text-properties p0 (point)
                         '(face notification-manager-hide-face mark body))
    ;; body
    (setq p0 (point))
    (notification-manager-insert-html body)
    (add-text-properties p0 (point) '(face notification-manager-body-face))
    (insert "\n")
    ;; ---
    (setq p0 (point))
    (insert "---\n")
    (set-text-properties p0 (point)
                         '(face notification-manager-hide-face mark status))
    ;; url
    (setq p0 (point))
    (insert url)
    (add-text-properties p0 (point) '(face notification-manager-url-face))
    (insert " ")
    ;; client
    (setq p0 (point))
    (insert client)
    (add-text-properties p0 (point) '(face notification-manager-client-face))
    ;; timestamp
    (insert " ")
    (setq p0 (point))
    (insert (notification-manager-timestamp-to-string timestamp))
    (add-text-properties p0 (point) '(face notification-manager-timestamp-face))
    ;; change line
    (insert "\n")
    ;; set background
    (notification-manager-set-background p1 (point) bg)
    (insert "\n")
    ))

(defun notification-manager-do-update (url msg)
)

(defun notification-manager-do-status (url msg)
  (let ((lifetime (cdr (assoc 'lifetime msg)))
        (uuid (cdr (assoc 'uuid msg)))
        (bg (notification-manager-get-background msg))
        p0 p1 p2)
    (goto-char (point-max))
    ;; search uuid
    (when (notification-manager-nav-goto uuid)
      (setq p1 (point))
      (search-forward " ")
      (setq p0 (point))
      (end-of-line)
      (delete-region p0 (point))
      ;; timeout
      (setq p0 (point))
      (insert (format "%d" (/ lifetime 1000)))
      (add-text-properties p0 (point)
                           `(face (notification-manager-timeout-face
                                   ,(get-text-property p1 'face)))))
    ))

(defun notification-manager-do-close (url msg)
)


(defun notification-manager-process (url msg)
  "Process notification message."
  (notification-manager-log url msg)
  (save-excursion
    (setq buffer-read-only nil)
    (let ((cmd (cdr (assoc 'command msg))))
      (cond ((equal cmd "create")
             (notification-manager-do-create url msg))
            ((equal cmd "update")
             (notification-manager-do-update url msg))
            ((equal cmd "status")
             (notification-manager-do-status url msg))
            ((equal cmd "close")
             (notification-manager-do-close url msg))))
    (setq buffer-read-only t)))

(defun notification-manager-clearup ()
  "Clearup when buffer is killed, mainly close websockets."
  (when (eq major-mode 'notification-manager-mode)
    (when (and notification-manager-sock-client
               (websocket-openp notification-manager-sock-client))
      (websocket-close notification-manager-sock-client))
    (setq notification-manager-sock-client nil)
    (when (and notification-manager-sock-ui
             (websocket-openp notification-manager-sock-ui))
      (websocket-close notification-manager-sock-ui))
    (setq notification-manager-sock-ui nil)))


(defun notification-manager-on-message (ws f)
  "Call back for websocket onMessage event."
  (with-current-buffer
      (notification-manager-buffer-name
       (websocket-url ws))
    (notification-manager-process
     (websocket-url ws)
     (with-temp-buffer
       (insert (decode-coding-string (websocket-frame-payload f) 'utf-8))
       (goto-char (point-min))
       (json-read-object)))))

(defun notification-manager-init (url)
  "Init notification manager."
  (notification-manager-clearup)
  ;; sock client
  (setq notification-manager-sock-client
        (websocket-open
         (format "%s/c?name=emacs" url)
         :on-open (lambda (ws)
                    (message
                     "notification manager: client websocket opened"))
         :on-message #'notification-manager-on-message
         :on-close (lambda (ws)
                     (message
                      "notification manager: client websocket closed"))))
  ;; sock ui
  (setq notification-manager-sock-ui
        (websocket-open
         url
         :on-open (lambda (ws)
                    (message "notification manager: ui websocket opened"))
         :on-message #'notification-manager-on-message
         :on-close (lambda (ws)
                     (message
                      "notification manager: ui websocket closed"))))

  (add-hook 'kill-buffer-hook 'notification-manager-clearup))

(defun notification-manager-mode (url)
  "Setup notification manager buffer"
  (interactive "s")
  (kill-all-local-variables)
  (setq buffer-read-only nil)
  (erase-buffer)
  (set-syntax-table text-mode-syntax-table)
  (use-local-map notification-manager-mode-map)
  ;;(set (make-local-variable 'font-lock-defaults)
  ;;'(notification-manager-mode-font-lock-defaults))
  ;;(set (make-local-variable 'indent-line-function)
  ;;'notification-manager-mode-indent-line)
  (setq major-mode 'notification-manager-mode)
  (setq mode-name "NoMan")
  (setq buffer-read-only t)
  (notification-manager-init url)
  (run-hooks 'notification-manager-mode-hook))

(defun notification-manager (url)
  "Open a notification manager for `url', default to ws://127.0.0.1:7755"
  (interactive "saddress: ")
  (let ((name (notification-manager-buffer-name url)))
    (switch-to-buffer name)
    (notification-manager-mode url)))

(provide 'notification-manager)
;;; notification-manager.el ends here

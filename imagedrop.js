/*
 * Imagedrop.js  v2.0.3 (2022-03-06)
 *
 * Copyright 2021 yuchan1.
 * Licensed under the MIT license.
 *
 * (javascriptライブラリの説明)
 * これはformタグ下に、画像ファイルをドラッグ＆ドロップ、またはダブルクリックして選択するエリアを提供し、画像をアップロードをするためのjavascriptの軽量なライブラリです。
 *
 * (前提条件)
 * ・imagedrop.jsとimagedrop.cssのファイルを読み込みしてください。
 * ・ファイルアップロードのPost処理にはaxiosを使用しています。axiosのライブラリをインストールして下さい。
 * ・Google ChromeまたはMicrosoft Edgeで動作します。
 * ・CSRF対策用のコードを設定しないと動作しません。this.imagedrop.setRequestVerificationTokenIdName("__RequestVerificationToken")のように、フレームワークに合わせてidを指定して下さい。
 * ・upload時のサーバー側の戻り値として、成功時はfileNameを受け取り。失敗時はメッセージを受け取ってalert表示をするようにしています。サーバー側でも2重チェックをして下さい。
 * 
 * (使い方)
 * ・html
 * <html>
 *     <body>
 *         <div class="col-md-6">
 *             <div class="content-main">
 *                 <form id="imagedrop" class="imagedrop" enctype="multipart/form-data"></form>
 *                 <input type="hidden" id="transactionId" />
 *                 <input type="hidden" id="fileName" />
 *             </div>
 *         </div>
 *     <body>
 * </html>
 *
 * ・javascript
 * <script>
 *     // 通常
 *     const uploadUrl = "xxx";
 *     const transactionId = 1;
 *     let fileName = "xxx";
 * 
 *     this.imagedrop = new Imagedrop();
 *     this.imagedrop.setCheckedUser(true);
 *     this.imagedrop.setUploadUrl(uploadUrl);
 *     this.imagedrop.setDirectoryPath("xxx");
 *     this.imagedrop.setRequestVerificationTokenName("__RequestVerificationToken");
 *
 *     // setTransactionは必要時のみ。
 *     this.imagedrop.setTransactionIdPropertyName("xxx");
 *     this.imagedrop.setTransactionId(transactionId);
 *     
 *     // ファイル名の設定または取得
 *     this.imagedrop.setFileName(fileName);
 *     this.imagedrop.getFileName();
 * </script>
 */

class Imagedrop {
    /*
     *  constructor()                                           : constructor
     *  
     *  setUserCheck(isCheckedUser)                             : Set user check
     *  setUploadUrl(uploadUrl)                                 : Set upload url
     *  setDirectoryPath(directoryPath)                         : Set directory path
     *  setRequestVerificationToken(requestVerificationToken)   : Set "RequestVerificationToken"
     *  
     *  setTransactionIdPropertyName(transactionIdPropertyName) : Set "transactionIdPropertyName"
     *  setTransactionId(transactionId)                         : Set "transactionId
     *  
     *  isCheckedFile()                                         : (Run in class) Checked file
     *  upload(dragAndDropMode)                                 : (Run in class) Upload. dragAndDropMode === true : drag and drop, dragAndDropMode === false : input change
     *  
     *  setFileName(fileName)                                   : Set file name
     *  getFileName()                                           : Get file name
     * 
     */

    constructor() {
        // Prepare HTML for drag and drop
        const template = "\n" +
            "<div class=\"drag-and-drop-area\" id=\"dragAndDropArea\">\n" +
            "    <input type=\"file\" id=\"files\" name=\"files\" accept=\"image/jpeg\" style=\"display: none\" multiple />\n" +
            "    <div class=\"default-message\" id=\"defaultMessage\">\n" +
            "        <p>画像ファイルをドラッグ＆ドロップ、またはダブルクリックして選択</p>\n" +
            "        <p>Drag and drop the image file, or double-click to select it</p>\n" +
            "        <p>(.jpg、max 1MB)</p>\n" +
            "    </div>\n" +
            "    <div class=\"preview-image\" id=\"previewImage\" style=\"display: none\"></div>\n" +
            "</div>\n";

        this._form = document.getElementById("imagedrop");
        let dragAndDropArea = document.getElementById("dragAndDropArea");
        dragAndDropArea ? dragAndDropArea.parentNode.removeChild(dragAndDropArea) : null;
        this._form.insertAdjacentHTML("afterbegin", template);

        // Store in this
        this._dragAndDropArea = document.getElementById("dragAndDropArea");
        this._inputFile = document.getElementById("files");
        this._defaultMessage = document.getElementById("defaultMessage");
        this._previewImage = document.getElementById("previewImage");
        this._previewFileName = document.getElementById("previewFileName");

        this._files = null;
        this._size = { width: "100%", height: "auto" };

        this._userCheck = false;
        this._uploadUrl = null;
        this._directoryPath = null;
        this._requestVerificationTokenIdName = null;

        this._transactionIdName = null;
        this._transactionId = null;

        this._fileName = null;

        // Save this to self for use with addEventListener
        let _self = this;

        // addEventListener
        this._dragAndDropArea.addEventListener("dragenter", function (event) {
            event.stopPropagation();
            event.preventDefault();
        });

        this._dragAndDropArea.addEventListener("dragover", function (event) {
            event.stopPropagation();
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy"
        });

        this._dragAndDropArea.addEventListener("drop", function (event) {
            event.stopPropagation();
            event.preventDefault();

            if (!_self._isCheckedUser) {
                alert("編集権限がありません。 (You do not have edit permission.)");
                return;
            }

            _self._files = event.dataTransfer.files;

            if (_self._fileName) {
                alert("ファイルがアップロード済みのため実行できません。 (The file has already been uploaded and cannot be executed.)");
                return;
            }

            if (_self.isCheckedFile()) {
                _self.upload(true);
            }
        });

        this._dragAndDropArea.addEventListener("dblclick", function (event) {
            if (!_self._isCheckedUser) {
                alert("編集権限がありません。 (You do not have edit permission.)");
                return;
            }

            if (_self._fileName) {
                alert("ファイルがアップロード済みのため実行できません。 (The file has already been uploaded and cannot be executed.)");
                return;
            }

            _self._inputFile.click();
        });

        this._inputFile.addEventListener("change", function (event) {
            _self._files = _self._inputFile.files;

            if (_self.isCheckedFile()) {
                _self.upload(false);
            }
        });

        this._dragAndDropArea.addEventListener("dragenter", function (event) {
            event.stopPropagation();
            event.preventDefault();
        });

        this._dragAndDropArea.addEventListener("dragover", function (event) {
            event.stopPropagation();
            event.preventDefault();
        });

        this._dragAndDropArea.addEventListener("drop", function (event) {
            event.stopPropagation();
            event.preventDefault();
        });
    }

    setUserCheck(isCheckedUser) {
        this._isCheckedUser = isCheckedUser;
    }

    setUploadUrl(uploadUrl) {
        this._uploadUrl = uploadUrl;
    }

    setDirectoryPath(directoryPath) {
        this._directoryPath = directoryPath;
    }

    setRequestVerificationToken(requestVerificationToken) {
        this._requestVerificationToken = requestVerificationToken;
    }

    setTransactionIdPropertyName(transactionIdPropertyName) {
        this._transactionIdPropertyName = transactionIdPropertyName.toString();
    }

    setTransactionId(transactionId) {
        this._transactionId = Number(transactionId);
    }

    isCheckedFile() {
        const files = this._files;

        if (!files) {
            alert("ファイルが見つからないためアップロードは実行できません。 (The upload cannot be performed because the file cannot be found.)");
            return false;
        }

        if (files.length > 1) {
            alert("複数ファイルのアップロードは実行できません。 (You cannot upload multiple files.)");
            return false;
        }

        let file = files[0];
        const fileName = file.name.toLowerCase();
        const pos = fileName.lastIndexOf('.');
        const fileExtension = fileName.slice(pos);

        let fileType = file.type;

        if (fileExtension != ".jpg" || fileType != "image/jpeg") {
            alert("jpg以外のファイルはアップロードは実行できません。 (Files other than jpg cannot be uploaded.)");
            return false;
        }

        const fileSize = file.size / 1024 / 1024;

        if (fileSize > 1) {
            alert("1MBより大きいサイズのファイルはアップロードは実行できません。 (Files larger than 1MB cannot be uploaded.)");
            return false;
        }

        return true;
    }

    upload(dragAndDropMode) {
        let _self = this;
        let formData = null;

        if (dragAndDropMode) {
            formData = new FormData(this._form);

            const files = this._files;
            for (let i = 0; i < files.length; i++) {
                formData.append("files", files[i], files[i].name);
            }

        } else {
            formData = new FormData(this._form);
        }

        if (this._transactionIdPropertyName) {
            formData.append(this._transactionIdPropertyName, this._transactionId);
        }

        // axios
        axios({
            method: "post",
            url: this._uploadUrl,
            headers: {
                contentType: "multipart/form-data",
                "RequestVerificationToken": this._requestVerificationToken
            },
            data: formData
        }).then((response) => {
            const fileName = response.data["fileName"];
            _self.setFileName(fileName);
            console.log("File upload success");
        }).catch((response) => {
            let message = response.data["message"];
            _self.setFileName(null);
            console.log("File upload failure : " + message);
            alert(message);
        });
    }

    setFileName(fileName) {
        let status = true;

        if (!fileName) {
            status = false;
        }

        // Image insert or remove
        if (status) {
            // クリア
            this._previewImage.innerHTML = "";
            document.getElementById("files").value = "";

            // 再セット
            const filePath = this._directoryPath + "/" + fileName;

            const imageHtml = "<img class=\"image\" id=\"image\" src=\"" + filePath + "\" style=\"width: " + this._size.width + "; height: " + this._size.height + "; \" />"
            this._previewImage.insertAdjacentHTML("beforeend", imageHtml);

            this._defaultMessage.style.display = "none";
            this._previewImage.style.display = "block";
            document.getElementById("fileName").value = fileName;
            this._fileName = fileName;

        } else {
            this._previewImage.innerHTML = "";

            this._defaultMessage.style.display = "block";
            this._previewImage.style.display = "none";
            document.getElementById("files").value = "";
            document.getElementById("fileName").value = "";
            this._fileName = null;
        }

        // Delete if focus is on
        document.activeElement.blur();

        // Fire event (For adjusting the display area)
        let event = window.document.createEvent("UIEvents");    // new Eventが現在の推奨方法
        event.initUIEvent("resize", true, false, window, 0);
        window.dispatchEvent(event);
    }

    getFileName() {
        return this._fileName;
    }
};

/*
 * Imagedrop.js  v2.0.0 (2021-07-26)
 *
 * Copyright 2021 yuchan.
 * Licensed under the MIT license.
 *
 * (前提条件)
 * ・Google ChromeまたはMicrosoft Edgeで動作します。IEは開発終了していますのでサポートしません。
 * ・ファイルアップロードのPost処理にはaxiosを使用しています。axiosのライブラリをインストールして下さい。
 * ・CSRF対策用のコードを設定しないと動作しません。this.imagedrop.setRequestVerificationTokenIdName("__RequestVerificationToken")のように、フレームワークに合わせてidを指定して下さい。
 * ・upload時のサーバー側の戻り値として、成功時はfileNameを受け取り。失敗時はメッセージを受け取ってalert表示をするようにしています。サーバー側ではその処理を追加して下さい。
 * 
 * (使い方)
 * ・html
 * <html>
 *     <body>
 *         // ①imagedropで利用する場所です。
 *         <div class="col-md-6">
 *             <div class="content-main">
 *                 <form id="imagedrop" class="imagedrop" enctype="multipart/form-data"></form>
 *                 <input type="hidden" id="transactionId" />
 *                 <input type="hidden" id="fileName" />
 *             </div>
 *         </div>
 *
 *         // ②imagedropのデータを反映する場所です
 *         <div class="col-md-6">
 *             <div class="content-main">
 *                 <form>
 *                     <input type="hidden" v-if="viewModel" v-bind:value="viewModel.TransactionId" />
 *                     <input type="hidden" v-if="viewModel" v-model.trim="viewModel.FileName" />
 *                 </form>
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
 *     this.imagedrop.setRequestVerificationTokenIdName("__RequestVerificationToken");
 *
 *     // setTransactionは必要時のみ。
 *     this.imagedrop.setTransactionIdPropertyName("xxx");
 *     this.imagedrop.setTransactionId(transactionId);
 *     
 *     // ファイル名の設定または取得
 *     this.imagedrop.setFileName(fileName);
 *     this.imagedrop.getFileName();
 *
 *     // Vue.js3を使う場合
 *     <!--
 *         this.imagedrop = new Imagedrop();
 *         this.imagedrop.setCheckedUser(this.isCheckedUser);
 *         this.imagedrop.setUploadUrl(this.uploadUrl);
 *         this.imagedrop.setDirectoryPath("xxx");
 *         this.imagedrop.setRequestVerificationTokenIdName("__RequestVerificationToken");
 *
 *         // setTransactionは必要時のみ。
 *         this.imagedrop.setTransactionIdPropertyName("xxx");
 *         this.imagedrop.setTransactionId(this.transactionId);
 *         
 *         // ファイル名の設定または取得
 *         this.imagedrop.setFileName(this.viewModel.FileName);
 *         this.imagedrop.getFileName();
 *     -->
 * </script>
 */

class Imagedrop {
    constructor() {
        // ドラッグ＆ドロップ用のHTML準備
        const template = "\n" +
            "<div class=\"drag-and-drop-area\" id=\"dragAndDropArea\">\n" +
            "    <input type=\"file\" id=\"files\" name=\"files\" accept=\"image/jpeg\" style=\"display: none\" multiple />\n" +
            "    <div class=\"default-message\" id=\"defaultMessage\">\n" +
            "        <p>画像ファイルをドラッグ＆ドロップ、またはダブルクリックして選択</p>\n" +
            "        <p>(.jpgファイル、1MBまで)</p>\n" +
            "    </div>\n" +
            "    <div class=\"preview-image\" id=\"previewImage\" style=\"display: none\"></div>\n" +
            "</div>\n";

        this._form = document.getElementById("imagedrop");
        let dragAndDropArea = document.getElementById("dragAndDropArea");
        dragAndDropArea ? dragAndDropArea.parentNode.removeChild(dragAndDropArea) : null;
        this._form.insertAdjacentHTML("afterbegin", template);

        // thisに格納
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

        // addEventListenerで使用するため、thisをselfに退避
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
                alert("編集権限がありません。");
                return;
            }

            _self._files = event.dataTransfer.files;

            if (_self._fileName) {
                alert("ファイルがアップロード済みのため実行できません。");
                return;
            }

            if (_self.isCheckedFile()) {
                _self.upload(true);
            }
        });

        this._dragAndDropArea.addEventListener("dblclick", function (event) {
            if (!_self._isCheckedUser) {
                alert("編集権限がありません。");
                return;
            }

            if (_self._fileName) {
                alert("ファイルがアップロード済みのため実行できません。");
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

    setCheckedUser(isCheckedUser) {
        this._isCheckedUser = isCheckedUser;
    }

    setUploadUrl(uploadUrl) {
        this._uploadUrl = uploadUrl;
    }

    setDirectoryPath(directoryPath) {
        this._directoryPath = directoryPath;
    }

    setRequestVerificationTokenIdName(requestVerificationTokenIdName) {
        this._requestVerificationTokenIdName = requestVerificationTokenIdName;
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
            alert("ファイルが見つからないためアップロードは実行できません。");
            return false;
        }

        if (files.length > 1) {
            alert("複数ファイルのアップロードは実行できません。");
            return false;
        }

        let file = files[0];
        const fileName = file.name.toLowerCase();
        const pos = fileName.lastIndexOf('.');
        const fileExtension = fileName.slice(pos);

        let fileType = file.type;

        if (fileExtension != ".jpg" || fileType != "image/jpeg") {
            alert("jpg以外のファイルはアップロードは実行できません。");
            return false;
        }

        const fileSize = file.size / 1024 / 1024;

        if (fileSize > 1) {
            alert("1MBより大きいサイズのファイルはアップロードは実行できません。");
            return false;
        }

        return true;
    }

    upload(dragAndDropMode) {
        let _self = this;
        let formData = null;

        if (dragAndDropMode) {
            formData = new FormData(this._form);
            // this._inputFile.parentNode.removeChild(this._inputFile);

            const files = this._files;
            for (let i = 0; i < files.length; i++) {
                formData.append("files", files[i], files[i].name);
            }

        } else {
            formData = new FormData(this._form);
        }

        if (this.transactionIdPropertyName !== null) {
            formData.append(this._transactionIdPropertyName, this._transactionId);
        }

        const requestVerificationToken = document.getElementsByName(this._requestVerificationTokenIdName)[0].value;

        // axios
        axios({
            method: "post",
            url: this._uploadUrl,
            headers: {
                contentType: "multipart/form-data",
                "RequestVerificationToken": requestVerificationToken
            },
            data: formData
        }).then((response) => {
            const fileName = response.data.fileName;
            _self.setFileName(fileName);
            console.log("success");
        }).catch((response) => {
            let message = response.data.message;
            _self.setFileName(null);
            console.log("failure : " + message);
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

        // focusが当たっていたら削除する
        document.activeElement.blur();

        // Fire event (表示領域の調整用)
        let event = window.document.createEvent("UIEvents");
        event.initUIEvent("resize", true, false, window, 0);
        window.dispatchEvent(event);
    }

    getFileName() {
        return this._fileName;
    }
}

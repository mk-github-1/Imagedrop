# Imagedrop

Imagedrop  v2.0.1 (2021-07-26)     Licensed under the MIT license.

これはformタグ下に、画像ファイルをドラッグ＆ドロップ、またはダブルクリックして選択するエリアを提供するためのjavascriptの軽量なライブラリです。

# 前提条件

* imagedrop.jsとimagedrop.cssのファイルを読み込みしてください。
* ファイルアップロードのPost処理にはaxiosを使用しています。axiosのライブラリをインストールして下さい。
* Google ChromeまたはMicrosoft Edgeで動作します。IEは開発終了していますのでサポートしません。
* CSRF対策用のコードを設定しないと動作しません。this.imagedrop.setRequestVerificationTokenName("__RequestVerificationToken")のように、フレームワークに合わせてidを指定して下さい。
* upload時のサーバー側の戻り値として、成功時はfileNameを受け取り。失敗時はメッセージを受け取ってalert表示をするようにしています。サーバー側ではその処理を追加して下さい。
* フレームワークに依存しないように作成しています。HTML中のプレーンなidとclassをメインで使用しています。Vue.jsと組み合わせて利用することもすることも可能です。

# 使い方

・html
```
<html>
    <body>
        <div class="col-md-6">
            <div class="content-main">
                <form id="imagedrop" class="imagedrop" enctype="multipart/form-data"></form>
                <input type="hidden" id="transactionId" />
                <input type="hidden" id="fileName" />
            </div>
         </div>
    <body>
</html>
```
        
・javascript
```
<script>
    // 通常
    const uploadUrl = "xxx";
    const transactionId = 1;
    let fileName = "xxx";

    this.imagedrop = new Imagedrop();
    this.imagedrop.setCheckedUser(true);
    this.imagedrop.setUploadUrl(uploadUrl);
    this.imagedrop.setDirectoryPath("xxx");
    this.imagedrop.setRequestVerificationTokenName("__RequestVerificationToken");

    // setTransactionは必要時のみ。
    this.imagedrop.setTransactionIdPropertyName("xxx");
    this.imagedrop.setTransactionId(transactionId);
    
    // ファイル名の設定または取得
    this.imagedrop.setFileName(fileName);
    this.imagedrop.getFileName();
</script>
```

# テンプレートの仕組み
																
* HTMLに上記の使い方のformタグを設置することで、new Imagedrop() 時にform下に下記のテンプレートを展開
```
<form id="imagedrop" class="imagedrop" enctype="multipart/form-data"></form>

<!-- ここから　-->
<div class="drag-and-drop-area" id="drag-and-drop-area">
    <input type="file" id="files" name="files" accept="image/jpeg" style="display: none" multiple />
    <div class="default-message" id="defaultMessage">
        <p>画像ファイルをドラッグ＆ドロップ、またはダブルクリックして選択</p>
        <p>(.jpgファイル、1MBまで)</p>
    </div>
    <div class="preview-image" id="previewImage" style="display: none"></div>
</div>
<!-- ここまで -->

<input type="hidden" id="transactionId" />
<input type="hidden" id="fileName" />
```

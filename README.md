# Imagedrop

Imagedrop  v2.0.3 (2022-08-01)     Licensed under the MIT license.

# javascriptライブラリの説明

これはformタグ下に、画像ファイルをドラッグ＆ドロップ、またはダブルクリックして選択するエリアを提供し、画像をアップロードをするためのjavascriptの軽量なライブラリです。

# 前提条件

・imagedrop.jsとimagedrop.cssのファイルを読み込みしてください。

・ファイルアップロードのPost処理にはaxiosを使用しています。axiosのライブラリをインストールして下さい。uploadUrlを正しく指定してPOSTができる状態でないとファイルアップロードは実行できません。

・Google ChromeまたはMicrosoft Edgeで動作します。

・CSRF対策用のコードを設定しないと動作しません。this.imagedrop.setRequestVerificationTokenIdName("__RequestVerificationToken")  
のように、フレームワークに合わせてidを指定して下さい。
  
・upload時のサーバー側の戻り値として、成功時はfileNameを受け取り。失敗時はメッセージを受け取ってalert表示をするようにしています。サーバー側でも2重チェックをして下さい。

# 使い方

(例)html部分
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
        
(例)javascript部分
```
<script>
    // Vue.jsで使用するときはthis.imagedropとしてください
    const uploadUrl = "xxx";
    const transactionId = 1;
    let fileName = "xxx";

    let imagedrop = new Imagedrop();
    imagedrop.setCheckedUser(true);
    imagedrop.setUploadUrl(uploadUrl);
    imagedrop.setDirectoryPath("xxx");
    imagedrop.setRequestVerificationTokenName("__RequestVerificationToken");

    // setTransactionは必要時のみ。
    imagedrop.setTransactionIdPropertyName("xxx");
    imagedrop.setTransactionId(transactionId);
    
    // ファイル名の設定または取得
    imagedrop.setFileName(fileName);
    imagedrop.getFileName();
</script>
```

# テンプレートの仕組み
																
HTMLに上記の使い方のformタグを設置することで、new Imagedrop() 時にform下に下記のテンプレートを展開します。

```
<form id="imagedrop" class="imagedrop" enctype="multipart/form-data"></form>

<!-- テンプレートはここから　-->
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

# 今後の課題
ローカルのファイルをブラウザに表示し、ボタン実行でファイルアップロードしたほうがよい。
 -> version 3で対応予定。

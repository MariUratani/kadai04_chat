// firebase-database.js

import { app } from './firebase-config.js';
import { getDatabase, ref, push, set, update, onChildAdded, onChildChanged, remove, onChildRemoved } 
from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const db = getDatabase(app);
const dbRef = ref(db,"chat");

//データ登録
$("#send").on("click",function(){
    const now = new Date(); // 現在の日付・時刻を挿入
    // 入力OKの場合にFirebaseにデータ送信
    const uname = $("#uname").val().trim(); // 名前入力値を取得し前後の空白を削除
    const text = $("#text").val().trim(); // メッセージ入力値を取得し前後の空白を削除

// 入力チェック
    if (!uname) {
    alert("名前を入力してください");
    return; // 処理を中断
    }

    if (!text) {
    alert("メッセージを入力してください");
    return; // 処理を中断
    }
const msg ={
        uname : uname,
        text : text,
        nowDate : now.toISOString(), // 現在の日付をISO形式（"2024-03-07T15:30:00"）で取得            
        isEdited : false, // msgオブジェクトにisEditedプロパティを追加し、初期値をfalseに設定
        isDeleted: false  // 削除フラグを追加
    }

    const newPostRef = push(dbRef); // unique keyを生成
    set(newPostRef,msg); // DBに値をセットする
    $("#text").val(''); // 送信後にテキストエリアをクリア
});

//最初にデータ習得＆onSnapshotでリアルタイムデータを取得
onChildAdded(dbRef,function(data){
    const msg = data.val();
    const key = data.key; // 削除・更新するときにunique keyを指定する
    const messageTime = new Date(msg.nowDate); // msg.nowDateの文字列をJavaScriptの日付オブジェクトに変換
    const formattedTime = messageTime.toLocaleString('ja-JP',{
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }); // toLocaleString()メソッドを使用して、日本のロケール（ja-JP）に基づいて表示"2024年3月7日 15:30"

    let h = '<p id="'+key+'">';
        h += msg.uname;
        h += " ｜ ";
        h += formattedTime;
        h += '<br>';
        if (msg.isDeleted) {
            h += '(メッセージの送信を取り消しました)'; // 削除フラグがtrueの場合にメッセージを表示
        } else {
            h += '<span contentEditable = "true" id="'+key+'_update">'+msg.text+'</span>';
            if (msg.isEdited) h += ' <span>(編集済み)</span>'; // isEditedがtrueの場合に「編集済」を表示
            h += '<br>';
            h += '<span class="remove" data-key="'+key+'"><i class="bi bi-trash3"></i></span>'
            h += '<span class="update" data-key="'+key+'"><i class="bi bi-send-plus"></i></span>'
        }
        h += '</p>';
        $("#output").append(h); //outputの最後に追加
});

// 削除イベント
$("#output").on("click", ".remove", function(){
const key = $(this).attr("data-key");
const removeRef = ref(db, "chat/" + key); // chatノードの該当メッセージを参照
    const updates = {
        isDeleted: true // 削除フラグを立てる
    };
    update(removeRef, updates); // 削除時にisDeletedをtrueに更新
});

// 削除処理がFirebase側で実行されたらイベント発生
onChildRemoved(dbRef, (data) => {
$("#"+data.key).remove(); //DOM操作関数（対象を削除）
});

// 更新処理がFirebase側で実行されたらイベント発生
onChildChanged(dbRef, (data) => {
const key = data.key;
$("#"+key+'_update').html(data.val().text);
$("#"+key+'_update').fadeOut(800).fadeIn(400);
});

// 更新イベント
$("#output").on("click", ".update", function(){
const key = $(this).attr("data-key");
const updatedText = $("#"+key+'_update').html(); // メッセージ本文のテキストエリア(contentEditable)の内容を取得
const updates = {};
updates["/chat/" + key + "/text"] = updatedText; //メッセージ本文のパスを作成し、そのパスに新しいテキスト(updatedText)を関連付け
updates["/chat/" + key + "/isEdited"] = true; //メッセージ更新時にtrueに変更
update(ref(db), updates); // データベース内の指定されたパス(/chat/xxxxx/text)の値が新しいテキストで更新
});

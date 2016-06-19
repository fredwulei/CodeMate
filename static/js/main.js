var socketio = io.connect();


var editor = ace.edit("editor");
editor.setTheme("ace/theme/twilight");
editor.session.setMode("ace/mode/python");


var doc = editor.session.doc;
// var roomid = '';
var user = {'id':'', 'name':'', 'roomid': ''};

var recordingChange = true;

//-----------------------------


var marker = {}
marker.cursors = [{row: 0, column: 0}]
marker.update = function(html, markerLayer, session, config) {
    var start = config.firstRow, end = config.lastRow;
    var cursors = this.cursors
    for (var i = 0; i < cursors.length; i++) {
        var pos = this.cursors[i];
        if (pos.row < start) {
            continue
        } else if (pos.row > end) {
            break
        } else {
            // compute cursor position on screen
            // this code is based on ace/layer/marker.js
            var screenPos = session.documentToScreenPosition(pos)

            var height = config.lineHeight;
            var width = config.characterWidth;
            var top = markerLayer.$getTop(screenPos.row, config);
            var left = markerLayer.$padding + screenPos.column * width;
            // can add any html here
            html.push(
                "<div class='cursor' style='",
                "height:", height, "px;",
                "top:", top, "px;",
                "left:", left, "px; width:", width, "px'></div>"
            );
        }
    }
}
marker.redraw = function() {
   this.session._signal("changeFrontMarker");
}
marker.addCursor = function() {
    // add to this cursors
    // ....
    // trigger redraw
    marker.redraw()
}
marker.session = editor.session;
marker.session.addDynamicMarker(marker, true)
// call marker.session.removeMarker(marker.id) to remove it
// call marker.redraw after changing one of cursors


function makeid(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}



//-----------------------------



function processEvent(e) {
    for (var i = 0 ; i < e.clipboardData.items.length ; i++) {

        // get the clipboard item
        var clipboardItem = e.clipboardData.items[i];
        var type = clipboardItem.type;

        // if it's an image add it to the image field
        if (type.indexOf("image") != -1) {

            // get the image content and create an img dom element
            var blob = clipboardItem.getAsFile();
            var blobUrl = window.webkitURL.createObjectURL(blob);
            var img = $("<img/>");
            img.attr( "src", blobUrl);
            socketio.emit('updateProblem', {blob: blob});
            $('#problem').append(img);
        } else {
            console.log("Not supported: " + type);
        }

    }
}


$(function(){
    // $('#problem').html('<object data="http://www.fredsneverland.com">');

    $.fn.ewDrags = function(opt) {
        opt = $.extend({handle:"",cursor:"ew-resize", min: 10}, opt);

        if(opt.handle === "") {
            var $el = this;
        } else {
            var $el = this.find(opt.handle);
        }
     
        var priorCursor = $('body').css('cursor');

        return $el.css('cursor', opt.cursor).on("mousedown", function(e) {
          
            priorCursor = $('body').css('cursor');
            $('body').css('cursor', opt.cursor);
          
            if(opt.handle === "") {
                var $drag = $(this).addClass('draggable');
            } else {
                var $drag = $(this).addClass('active-handle').parent().addClass('draggable');
            }
            var z_idx = $drag.css('z-index'),
                drg_h = $drag.outerHeight(),
                drg_w = $drag.outerWidth(),
                pos_y = $drag.offset().top + drg_h - e.pageY,
                pos_x = $drag.offset().left + drg_w - e.pageX;
            $drag.css('z-index', 1000).parents().on("mousemove", function(e) {
                var prev = $('.draggable').prev();
                var next = $('.draggable').next(); 

                // console.log($(this));
                var total = prev.outerWidth() + next.outerWidth();
                // console.log(prev.offset());
                var ol = typeof prev === 'undefined' ? prev.offset().left : 0;
                var leftPercentage = (((e.pageX - ol) + (pos_x - drg_w / 2)) / total); 
                var rightPercentage = 1 - leftPercentage; 
              
                if(leftPercentage * 100 < opt.min || rightPercentage * 100 < opt.min){
                    return; 
                }
                prev.css('flex', leftPercentage.toString());
                next.css('flex', rightPercentage.toString()); 
               
                $(document).on("mouseup", function() {
                    $('body').css('cursor', priorCursor);
                        $('.draggable').removeClass('draggable').css('z-index', z_idx);
                });
                editor.resize();
            });
            e.preventDefault(); // disable selection
        });
    }


    $.fn.nsDrags = function(opt) {
        opt = $.extend({handle:"",cursor:"ns-resize", min: 10}, opt);

        if(opt.handle === "") {
            var $el = this;
        } else {
            var $el = this.find(opt.handle);
        }
     
        var priorCursor = $('body').css('cursor');

        return $el.css('cursor', opt.cursor).on("mousedown", function(e) {
          
            priorCursor = $('body').css('cursor');
            $('body').css('cursor', opt.cursor);
          
            if(opt.handle === "") {
                var $drag = $(this).addClass('draggable');
            } else {
                var $drag = $(this).addClass('active-handle').parent().addClass('draggable');
            }
            var z_idx = $drag.css('z-index'),
                drg_h = $drag.outerHeight(),
                drg_w = $drag.outerWidth(),
                pos_y = $drag.offset().top + drg_h - e.pageY,
                pos_x = $drag.offset().left + drg_w - e.pageX;
            $drag.css('z-index', 1000).parents().on("mousemove", function(e) {
                var prev = $('.draggable').prev();
                var next = $('.draggable').next(); 

                var total = prev.outerHeight() + next.outerHeight();


                var ol = typeof prev === 'undefined' ? prev.offset().top : 0;
                var leftPercentage = (((e.pageY - ol) + (pos_y - drg_h / 2)) / total); 
                var rightPercentage = 1 - leftPercentage; 
              
                if(leftPercentage * 100 < opt.min || rightPercentage * 100 < opt.min){
                    return; 
                }
                prev.css('flex', leftPercentage.toString());
                next.css('flex', rightPercentage.toString()); 
               
                $(document).on("mouseup", function() {
                    $('body').css('cursor', priorCursor);
                        $('.draggable').removeClass('draggable').css('z-index', z_idx);
                });
                editor.resize();
            });
            e.preventDefault(); // disable selection
        });
    }


    if(!user.name){
        user.name = prompt("Please enter your name", "Anonymous");
        socketio.emit('changeName', {name: user.name});
    }

    if(!user.roomid){
        user.roomid = prompt("Join or create a room", makeid());
        socketio.emit('joinOrCreateRoom', {roomid: user.roomid});
        $('#room-name').text(user.roomid);
    }
    // alert(user.name);


    $('#run').on('click', function(){
        var allLines = doc.getAllLines();
        socketio.emit('run', {lines: allLines});
    });

    $('#test').on('click', function(){
        // console.log(editor.getSession().getDocument());
        // socketio.emit('saveSession', {document: editor.getSession().getDocument()});
        socketio.emit('saveSession', {document: doc.getValue()});
    });


    $('#message-body').keypress(function (e) {
        if (e.which == 13) {
            var msg = $(this).val();
            if(msg !== ''){
                socketio.emit('chat', {msg: msg});
                $(this).val('');
            }
        }
    });


    $('#handle-1').nsDrags();
    $('#handle-2').ewDrags();
    $('#handle-3').nsDrags();



    // $('#resizer-1').on('mousedown', function(){
    //     console.log('start');
    //     $(this).attr('drag', true);
    // });

    // $('#resizer-1').on('mousemove', function(){
    //     if($(this).attr('drag') === 'true'){
    //         console.log($(this).position());
    //         var y = $(this).position().top;
    //         var total = screen.height - 30;
    //         var r1 = (y/total);
    //         var r2 = 1-r1;
    //         r1 = r1*100 + '%';
    //         r2 = r2*100 + '%';
    //         console.log(r1+'  ' + r2);
    //         $('#editor').css('flex-basis',r1);
    //         $('#console').css('flex-basis', r2);
    //     }
    // });

    // $('#resizer-1').on('mouseup mouseout', function(){
    //     console.log('end');
    //     $(this).attr('drag', false);
    // });





    //--------------------

    window.addEventListener("paste",processEvent);

    

    //--------------------

});



editor.on('change', function(e){
    // deltas.push(e.data);
    // console.log(e);
    if(recordingChange){
        var deltas = new Array();
        deltas.push(e);
        socketio.emit('changeDoc',{deltas: deltas});
    }
});


editor.on("input", function(e) {
    
});

editor.selection.on("changeCursor", function() {
    // console.log('changed');
    var pos = editor.getCursorPosition();
    // console.log(pos);
    socketio.emit('changeCursor',{pos: pos});
});


socketio.on("connected",function(uid){
    user.id = uid;
});

socketio.on("joinRoom",function(data){
    // console.log(data);
    var nameSpan = $('<span></span>');
    nameSpan.text(data.name);
    nameSpan.attr('uid', data.uid);
    $('#user-list').append(nameSpan);
});


socketio.on("getExistedInfo",function(data){
    var usernames = data.usernames;
    for(var i=0; i<usernames.length; i++){
        var n = usernames[i];
        var nameSpan = $('<span></span>');
        nameSpan.text(n);
        $('#user-list').append(nameSpan);
    }
    // console.log(data.document);
    // editor.session.setDocument(data.document);
    recordingChange = false;
    doc.setValue(data.document);
    // console.log(data.deltas);
    doc.applyDeltas(data.deltas);
    recordingChange = true;
});



socketio.on("changeCursor",function(data){
    if(data.uid !== user.id){
        // console.log(data.pos);
        marker.cursors = [{row: data.pos.row, column: data.pos.column}];
        marker.redraw();
    }
});

socketio.on("changeDoc",function(data){
    // console.log(data.uid);
    // console.log(user.id);
    // console.log(data.uid !== user.id);
    recordingChange = false;
    if(data.uid !== user.id){
        doc.applyDeltas(data.deltas);
        // console.log(data);
    }
    recordingChange = true;
});

socketio.on("runResult",function(data){
    // console.log(data);
    var dateStr = new Date().toLocaleTimeString();
    var title = '-----------------------------------\n' + data.name + ' ran the script at ' + dateStr + ' :\n' + '-----------------------------------\n';
    var history = $('#console').html();
    var str = history + title + data.result + '\n';
    // console.log(str);
    $('#console').text(str);
    $('#console').scrollTop($('#console').height());
});


$chatTemplate = $("<div class='chat-bubble'><div class='chat-sender'></div><div class='chat-content'></div></div>");

socketio.on("chat",function(data){
    // console.log(data);
    var chatDOM = $chatTemplate.clone(true);
    chatDOM.find('.chat-sender').text(data.name);
    chatDOM.find('.chat-content').text(data.msg);
    $('#message-container').append(chatDOM);
    // $('#message').scrollTop($('#message').height());
    // $('#message-container').scrollTop($('#message-container').scrollHeight);
    console.log($("#message-container")[0].scrollHeight);
    $("#message-container").animate({
        scrollTop: $("#message-container")[0].scrollHeight
    }, 200);
});

socketio.on("leave",function(data){
    $('#user-list span').each(function(){
        if($(this).attr('uid') === data.uid){
            $(this).remove();
            // break;
        }
    })
});


socketio.on("getDocument",function(){
    socketio.emit('saveDocument', {document: doc.getValue()});
});



socketio.on("updateProblem",function(data){
    if(data.uid !== user.id){


        var img = new Image();

        $(img).load(function(){
            $('#problem').html($(this));
        }).attr({
            src: data.url
        }).error(function(){
            //do something if image cannot load
        });


    }
});

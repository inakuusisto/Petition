$(document).ready(function() {

// toggle pictures

    $("#pictures img").click(function() {
        $('#car').toggle();
        $('#bike').toggle();
    });



// draw canvas

    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    document.querySelector('input[type="hidden"][name="signature"]').value = "";


    $('#canvas').mousedown(function(e){
        var mouseX = e.pageX - this.offsetLeft;
        var mouseY = e.pageY - this.offsetTop;

        paint = true;
        addClick(mouseX, mouseY);
        redraw();
    });


    $('#canvas').mousemove(function(e){
        if(paint) {
            addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
            redraw();
        }
    });


    $('#canvas').mouseup(function(){
        paint = false;
    });


    $('#canvas').mouseleave(function(){
        paint = false;
    });


    var clickX = new Array();
    var clickY = new Array();
    var clickDrag = new Array();
    var paint;

    function addClick(x, y, dragging)
    {
        clickX.push(x);
        clickY.push(y);
        clickDrag.push(dragging);
    }


    function redraw() {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        context.strokeStyle = "#000000";
        context.lineJoin = "round";
        context.lineWidth = 2;

        for(var i=0; i < clickX.length; i++) {
            context.beginPath();
            if(clickDrag[i] && i){
                context.moveTo(clickX[i-1], clickY[i-1]);
            }else{
                context.moveTo(clickX[i]-1, clickY[i]);
            }
            context.lineTo(clickX[i], clickY[i]);
            context.closePath();
            context.stroke();
        }
        sendSignVal();
    }


    function sendSignVal() {
        document.querySelector('input[type="hidden"][name="signature"]').value = canvas.toDataURL();
    }

});

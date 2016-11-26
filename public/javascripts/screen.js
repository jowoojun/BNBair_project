$(function() {
    $("div.border.affix-top").affix({offset: {top: 500} });
    var template = _.template($('#template').html());
    var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    if (width < 1023){
        console.log(width);
        $('#messages').append("<div class='fixed'><a href='/rooms/#{room._id}/booking' class='btn btn-lg btn-primary btn-block reserving'>예약 하기</a><div>");
        $('.col-md-4#room-side').addClass("hidden");
        $('div.map_div').addclass("#map");
    }else{
        $('.col-md-4#room-side.hidden').removeClass("hidden");
        $('div.map_div#map').removeClass("#map");
    }
});
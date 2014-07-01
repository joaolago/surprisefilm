if (Meteor.isClient) {

  Template.video.youtube_id = function () {
    return Session.get("youtube_id");
  };

  Template.start_screen.events({
    'click .btn' : function(){ surpriseFilm(); },
    'click .category' : function(evt){ toggleCategory(evt); },
    'click .author' : function(evt){ toggleAuthor(evt); },
    'click .about' : function(evt){ showAbout(evt); }
  });

  Template.video.events({
    'click .reset' : function(){ reset(); }    
  });

  Template.error.events({
    'click .reset' : function(){ reset(); }    
  });

  Template.end_screen.events({
    'click .redo' : function(){ surpriseFilm(); },
    'click .reset' : function(){ reset(); }    
  });

  Template.about_screen.events({
    'click .reset' : function(){ reset(); }    
  });

  Meteor.startup(function () {
    Session.set('YTApiReady', false);
  });
 
  onYouTubeIframeAPIReady = function() {
    Session.set('YTApiReady', true);
    setupVideo();
  };

  window.onPlayerReady = function () {
    //player.addEventListener("onStateChange", "onytplayerStateChange");
    $( "#start-screen button" ).fadeIn("fast");
  }

  window.onPlayerStateChange = function(event) {
    if (event.data == YT.PlayerState.ENDED) {
      showEndScreen();
    }
  }

  Template.video.created = function () {
    if (typeof player === 'undefined'){
      $.getScript('https://www.youtube.com/iframe_api', function () {});
    }
  }

  var toggleCategory = function (evt){
    var target = $(evt.target);
    target.toggleClass('selected');
  }

  var toggleAuthor = function (evt){
    var target = $(evt.target);
    $( ".author" ).removeClass('selected');
    
    target.addClass('selected');
  }

  var showAbout = function (evt){
    hideAllBut( "#about-screen" );
  }

  var assembleCategories = function(){
    return _.map($(".category.selected"),function(item){return $(item).data("name")}).join();
  }

  var reset = function(){
    hideAllBut( "#start-screen" );
    if(player){
      player.stopVideo();
    }
  }

  var surpriseFilm = function () {
    Session.set( "itunes-url", null); 
    Session.set( "amazon-url", null); 
    Session.set( "googleplay-url", null); 
    var author = $(".author.selected").data("name") == undefined ? "" : $(".author.selected").data("name");
    var category = assembleCategories();

    var searchString = "https://gdata.youtube.com/feeds/api/videos/?";
    if( author != ""){
      searchString += "author=" + author + "&";
    }

    if( category != ""){
      searchString += "category=" + category + ",&";
    }

    searchString += "alt=json&max-results=50";

    $.get(searchString,
      {}, 
      function(data){
        if(data.feed.entry){
          var r = Math.floor( Math.random() * data.feed.entry.length );
          Session.set( "youtube_id", data.feed.entry[r].id.$t.match(/videos\/(\S*.)/)[1]);

          if(player){
            player.loadVideoById(data.feed.entry[r].id.$t.match(/videos\/(\S*.)/)[1]);
          }

          hideAllBut( "#video-screen" );
          getMovieLinks(grabName(data.feed.entry[r].title.$t));
        } else {
          hideAllBut( "#error-screen" );
        }
      }
    ); 
  }

  var setupVideo = function (c) {

    player = null;
    player = new YT.Player('player', {
      videoId: Session.get( "youtube_id"),
      events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
      }
    });
  }

  var showEndScreen = function(){
    if( !Session.get("itunes-url") && !Session.get("amazon-url") && !Session.get("googleplay-url")){
      $( "#with-results" ).hide();
      $( "#without-results" ).show();
    }
    else{
      $( "#with-results" ).show();
      $( "#without-results" ).hide();


      if( Session.get("itunes-url") ){
        $( "#end-screen #itunes" ).attr("href", Session.get("itunes-url")).show();
      }
      if( Session.get("googleplay-url") ){
        $( "#end-screen #googleplay" ).attr("href", Session.get("googleplay-url")).show();
      }
      if( Session.get("amazon-url") ){
        $( "#end-screen #amazon" ).attr("href", Session.get("amazon-url")).show();
      }
    }
    hideAllBut( "#end-screen" );
    if(player){
      player.stopVideo();
    }
  }

  var getMovieLinks = function(title){
    //call amazon, get links, add affiliate link: surpri00c-20!
    makeItunesCall(title); 
    var titleForKimono = titleCleanup(title);
    makeMeteorCall(titleForKimono, "getGooglePlay", "googleplay-url");
    makeMeteorCall(titleForKimono, "getAmazon", "amazon-url");
  }

  var hideAllBut = function(keepalive){
    $( ".screen" ).fadeOut("fast", function(evt){
      if( _.where(_.map($(".screen"), function(v){return $(v).css("display")}), "block").length == 0 ){
        $( keepalive ).fadeIn("fast");
      }
    });
  }

  var grabName = function(string){
    var limiters = [
      "Official Theatrical Trailer",
      "Official Trailer",
      "UK Trailer",
      "Official Full HD Trailer",
      "Official Chinese Trailer",
      "Red Band Trailer",
      "- Movie Trailer",
      "Official International Trailer",
      "Official Teaser Trailer",
      "Teaser Trailer",
      "Exclusive Official",
      "Exclusive Trailer",
      "Trailer",
      "Exclusive HD",
      "Movie HD",
      "HD Movie",
      "Official IMAX",
      "- Movie",
      "- Official"
    ].join("|");
    return string.match(new RegExp("([a-zA-Z0-9\ :\\.]+?)(?=("+limiters+"))"))[0];
  }

  var makeMeteorCall = function(query, methodName, sessionVar){
    Meteor.call(methodName, query, function(error, results) {
      if( results && results.length > 0 ){
        Session.set( sessionVar, results[0].name.href ); 
      }
      else{
        Session.set( sessionVar, null); 
      }
    }); 
  }

  var makeItunesCall = function(query){
    $.ajax({
        url: "http://itunes.apple.com/search?term="+query+"&entity=movie&limit=1000",
        dataType: 'JSONP'
    })
    .done(function(data) { 
      if( data.results.length > 0){
        Session.set("itunes-url",data.results[0].trackViewUrl); 
      }
    })
    .fail(function(data) { console.log(data); });
  }

  var titleCleanup = function( query ){
    if( query[query.length - 1] == " "){
      query = query.slice( 0, query.length - 1 );
    }
    return query.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-");;
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.methods({
    //TODO: confirm what's happening with kimono calls with more than one word
    getGooglePlay: function (moviename) {
      this.unblock(); 
      var url = "http://www.kimonolabs.com/api/55atf1ka?apikey=8198aae4dab911ac38fc04a75223e22e&c=movies&q="+moviename;
      var result = Meteor.http.call("GET", url, {timeout : 300000});
      if(result.data.results.collection1){
        return result.data.results.collection1;
      }else{
        return result;
      }
    },
    getAmazon: function (moviename) {
      this.unblock(); 
      var url = "http://www.kimonolabs.com/api/3rmkhtfw?apikey=8198aae4dab911ac38fc04a75223e22e&&url=search-alias%3Dinstant-video&field-keywords="+moviename;
      var result = Meteor.http.call("GET", url, {timeout : 300000});
      if(result.data && result.data.results && result.data.results.collection1){
        return result.data.results.collection1;
      }else{
        return result;
      }
    }
  });
}
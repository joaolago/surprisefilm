SurpriseFilm = ( function () {
  var youtube_id = "";
  var itunes_url = "";
  var amazon_url = "";
  var googleplay_url = "";

  var init = function(){
    $(document).on( 'click', '.btn' , function(){ surpriseFilm(); })
    $(document).on( 'click', '.category' , function(evt){ toggleCategory(evt); })
    $(document).on( 'click', '.author' , function(evt){ toggleAuthor(evt); })
    $(document).on( 'click', '.reset' , function(){ reset(); }    )

    $(document).on( 'click', '.reset' , function(){ reset(); }    )

    $(document).on( 'click', '.redo' , function(){ surpriseFilm(); })

    $(document).on( 'click', '.reset' , function(){ reset(); }    )

    Youtube.init();

  };

  var toggleCategory = function (evt){
    var target = $(evt.target);
    target.toggleClass('selected');
  }

  var toggleAuthor = function (evt){
    var target = $(evt.target);
    $( ".author" ).removeClass('selected');
    
    target.addClass('selected');
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
          youtube_id = data.feed.entry[r].id.$t.match(/videos\/(\S*.)/)[1];

          Youtube.loadVideo({videoId: data.feed.entry[r].id.$t.match(/videos\/(\S*.)/)[1]});


          hideAllBut( "#video-screen" );
          getMovieLinks(grabName(data.feed.entry[r].title.$t));
        } else {
          hideAllBut( "#error-screen" );
        }
      }
    ); 
  }

  
  var showEndScreen = function(){
    if( !itunes_url && !amazon_url && !googleplay_url){
      $( "#with-results" ).hide();
      $( "#without-results" ).show();
    }
    else{
      $( "#with-results" ).show();
      $( "#without-results" ).hide();


      if( itunes_url ){
        $( "#end-screen #itunes" ).attr("href", itunes_url).show();
      }
      if( googleplay_url ){
        $( "#end-screen #googleplay" ).attr("href", googleplay_url).show();
      }
      if( amazon_url ){
        $( "#end-screen #amazon" ).attr("href", amazon_url).show();
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
    $( ".screen" ).animate(
      {"opacity": 0}, 
      "fast", 
      "linear", 
      function(){
        $( this ).hide();
        if( _.where(_.map($(".screen"), function(v){return $(v).css("display")}), "block").length == 0 ){
          $( keepalive ).show().animate({"opacity": 1},"fast", "linear");
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
    // Meteor.call(methodName, query, function(error, results) {
    //   if( results && results.length > 0 ){
    //     Session.set( sessionVar, results[0].name.href ); 
    //   }
    //   else{
    //     Session.set( sessionVar, null); 
    //   }
    // }); 
  }

  var makeItunesCall = function(query){
    $.get("http://itunes.apple.com/search?term="+query+"&entity=movie&limit=1000",
      {
        dataType: 'JSONP'
      }
    ,
    function(data) { 
      if( data.results.length > 0){
        itunes_url = data.results[0].trackViewUrl; 
      }
    });
  }

  var titleCleanup = function( query ){
    if( query[query.length - 1] == " "){
      query = query.slice( 0, query.length - 1 );
    }
    return query.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-");;
  }


  return {
    init: init
  }
}());
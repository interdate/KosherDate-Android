/*window.onerror = function(message, url, lineNumber) {
	//console.log("Error: "+message+" in "+url+" at line "+lineNumber);
	alert("Error: "+message+" in "+url+" at line "+lineNumber);

}
*/

pagesTracker = [];
pagesTracker.push('main_page');
var pushNotification;

checkNewMessagesRequest = '';
newMessages = '';
refreshChat = '';
checkBingo = '';



var app = { 

	apiUrl : 'http://m.kosherdate.co.il',
	pictureSource : '',
	destinationType : '',
	encodingType : '',	
	backPage : '',
	currentPageId : '',
	currentPageWrapper : '',
	recentScrollPos : '',
	
	action : '',
	requestUrl : '',
	requestMethod : '',
	response : '',
	responseItemsNumber : '',
	pageNumber : '',
	itemsPerPage : 16,
	container : '', 
	template : '',
	statAction : '',
	searchFuncsMainCall: '',
	sort: '',
	
	profileGroupTemplate : '',
	profileLineTemplate : '',
	profileLineTemplate2 : '',
	
	userId : '',
	reportAbuseUserId : '',
	gcmDeviceId : '',
	imageId : '',
	positionSaved : false,
	logged: false,
	exit: false,
	countMes: 0,
	newNotificationsCount: 0,
    contactCurrentAllMessagesNumber : 0,
    contactCurrentReadMessagesNumber : 0,

	swiper: null,
    bingoIsActive: false,
    bingos: [],

		
	init: function(){
		//navigator.splashscreen.hide();		
		app.ajaxSetup();		
		app.chooseMainPage();		
		app.pictureSource = navigator.camera.PictureSourceType;
		app.destinationType = navigator.camera.DestinationType;
		app.encodingType = navigator.camera.EncodingType;
		$('#mainContainer').css({'min-height': $(window).height()});
		$('#login_page').css({'height':(($('#header').width()*1.6)-$('#header').height())+'px'});
	},

	ajaxSetup: function(){
		
		var user = window.localStorage.getItem("user");
		var pass = window.localStorage.getItem("pass");
		
		if(user == '' && pass == ''){
			user = 'nouser';
			pass = 'nopass';
		}		
		
		$.ajaxSetup({			
			dataType: 'json',
			type: 'Get',
			timeout: 50000,
			beforeSend: function(xhr){
				//alert(user + ':' + pass);
				xhr.setRequestHeader ("Authorization", "Basic " + btoa ( user + ":" + pass) );
			},		
			statusCode:{
				
				403: function(response, textStatus, xhr){
					
					app.stopLoading();
					app.showPage('login_page');
					document.removeEventListener("backbutton", app.back, false);
					//app.printUsers();
					
					if(app.exit===false){
						app.alert('שם משתמש או סיסמה שגויים. אנא נסו שנית');
					}
					 
				}
		
			},
			
			error: function(response, textStatus, errorThrown){
				app.stopLoading();				
				//alert(response.status + ':' + errorThrown );
			},
			
			complete: function(response, status, jqXHR){
				//alert(response.status);
				app.stopLoading();
			},
		});		
	},

	alert: function(message){
		navigator.notification.alert(
			 message,
			 function(){},
			 'Notification',
			 'Ok'
		);
	},
	
	logout:function(){
		
		app.startLoading();
		clearTimeout(newMesssages);		

		if(checkNewMessagesRequest != '')
        	checkNewMessagesRequest.abort();


		pagesTracker = [];
		pagesTracker.push('login_page');
		app.exit = true;
		
		$.ajax({				
			url: app.apiUrl+'/api/v3/user/logout',
			success: function(data, status){
				//alert(JSON.stringify(data));
				if(data.logout == 1){
					app.logged = false;
					app.positionSaved = false;
					window.localStorage.setItem("userId", "");
					window.localStorage.setItem("user", "");
					window.localStorage.setItem("pass", "");
					app.UIHandler();
					app.ajaxSetup();
					app.stopLoading();
				}
			}
		});
	},

	UIHandler: function(){

		document.removeEventListener("backbutton", app.back, false);

		if(app.logged === false){
			var userInput = window.localStorage.getItem("userInput");
			if(userInput != 'null')
				$('#user_input').find('input').val(userInput);
			$('.appPage').hide();
			$('.new_mes').hide();
			$('#likesNotifications').hide();
			$("#login_page").show();
			$('#back').hide();
			$('#logout').hide();
			$('#contact').hide();
			$('#sign_up').show();
			//app.printUsers();
			app.currentPageId = 'login_page';
			app.currentPageWrapper = $('#'+app.currentPageId);
		}
		else{
			$('.appPage').hide();
			$("#main_page").show();
			$('#back').hide();
			$('#logout').show();
			$('#sign_up').hide();
			$('#likesNotifications').css({left:'auto',right:'0px'}).show();
			//$('#contact').show();
			app.currentPageId = 'main_page';
			app.currentPageWrapper = $('#'+app.currentPageId);

		}
	},

	loggedUserInit: function(){
		app.searchFuncsMainCall = true;
		app.setBannerDestination();
		app.checkNewMessages();
		app.checkBingo();
		//app.pushNotificationInit();
		app.sendUserPosition();
	},

	startLoading: function(){
		navigator.notification.activityStart(
				'טוען',
				'אנא המתן ...');
	},

	stopLoading: function(){
		navigator.notification.activityStop();
	},

	chooseMainPage: function(){

		pagesTracker = [];
		pagesTracker.push('main_page');
		app.startLoading();
		app.exit = false;

		$.ajax({
			url: app.apiUrl+'/api/v3/user/login',
			error: function(response){
				//alert(JSON.stringify(response));
			},
			statusCode:{
				403: function(response, status, xhr){
					app.logged = false;
					app.UIHandler();
				}
			},
			success: function(data, status){
				//alert(JSON.stringify(data));
				if(data.userId > 0){
					app.logged = true;
					window.localStorage.setItem("userId", data.userId);
					app.UIHandler();
					app.loggedUserInit();
					$(window).unbind("scroll");
					window.scrollTo(0, 0);
				}
			}
		});
	},

	setBannerDestination: function(){
		$.ajax({
			url: app.apiUrl+'/api/v3/user/banner',
			success: function(response, status){
				app.response = response;
				//alert(JSON.stringify(app.response));
				$('#bannerLink').attr("onclick",app.response.banner.func);
				if(app.response.banner.src!==''){
					$('#why_subscr').find('button').hide();
					if($('#bannerLink').find("img").size()===0)
						$('#why_subscr').append('<img src="'+app.response.banner.src+'" />');
					else{
						$('#bannerLink').find("img").attr("src",app.response.banner.src);
						$('#bannerLink').find("img").show();
					}
				}else{
					$('#bannerLink').find("img").hide();
					$('#why_subscr').find('button').text(app.response.banner.text).show();
				}
			}
		});
	},



	sendAuthData: function(){
		var userInput = $("#authForm .email").val();
		var pass = $("#authForm .password").val();
		user = unescape(encodeURIComponent(userInput));
		pass = unescape(encodeURIComponent(pass));
		app.exit = false;
		window.localStorage.setItem("user",user);
		window.localStorage.setItem("pass",pass);
		$.ajax({
			url: app.apiUrl+'/api/v3/user/login',
			beforeSend: function(xhr){
				user = window.localStorage.getItem("user");
				pass = window.localStorage.getItem("pass");
				xhr.setRequestHeader ("Authorization", "Basic " + btoa ( user + ":" + pass) );
			},
			success: function(data, status){
				if(data.userId > 0){
					app.logged = true;
					app.ajaxSetup();
					app.showPage('main_page');
					$('#logout').show();
					window.localStorage.setItem("userId", data.userId);
					window.localStorage.setItem("userInput", userInput);
					app.loggedUserInit();
					//document.removeEventListener("backbutton", app.back, false);
				}
			}
		});
	},

	sendUserPosition: function(){
		if(app.positionSaved === false){
			navigator.geolocation.getCurrentPosition(app.persistUserPosition, app.userPositionError);
		}
	},

	persistUserPosition: function(position){
		var data = {
			longitude: position.coords.longitude,
			latitude: position.coords.latitude
		};

		//alert(JSON.stringify(data));
		//return;

		$.ajax({
			url: app.apiUrl+'/api/v3/user/location',
			type: 'Post',
			data:JSON.stringify(data),
			success: function(response){
				app.response = response;
				app.positionSaved = app.response.result;
			}
		});
	},

	userPositionError: function(error){
		//alert('code: '    + error.code    + '\n' +
	    //      'message: ' + error.message + '\n');
	},

	printUsers: function(){
		$.ajax({
			url: app.apiUrl+'/api/v3/users/recently_visited/2',
			success: function(data, status){
				for ( var i = 0; i < data.users.length; i++) {
					$("#udp_"+i).find(".user_photo_wrap .user_photo").attr("src",data.users[i].mainImage);
					$("#udp_"+i).find("span").text(data.users[i].nickName);
					$("#udp_"+i).find(".address").text(data.users[i].city);
				}
				//$(".user_data_preview").slideToggle("slow");
				$(".user_data_preview").show();
			}
		});
	},

	contact: function(){
		//window.location.href = 'http://dating4disabled.com/contact.asp';
	},

	pushNotificationInit: function(){

		try{
        	pushNotification = window.plugins.pushNotification;
        	if (device.platform == 'android' || device.platform == 'Android') {
				//alert('registering android');
            	pushNotification.register(app.regSuccessGCM, app.regErrorGCM, {"senderID":"48205136182","ecb":"app.onNotificationGCM"});		// required!

			}
        }
		catch(err){
			txt="There was an error on this page.\n\n";
			txt+="Error description: " + err.message + "\n\n";
			alert(txt);
		}

	},

	// handle GCM notifications for Android
    onNotificationGCM: function(e) {
    	//alert(1);
    	//console.log('EVENT -> RECEIVED:' + e.event);
        switch( e.event ){
            case 'registered':
            	//alert("registered");
			if ( e.regid.length > 0 ){
				// Your GCM push server needs to know the regID before it can push to this device
				// here is where you might want to send it the regID for later use.
				//alert("REGISTERED -> REGID:" + e.regid);

				app.gcmDeviceId = e.regid;
				app.persistGcmDeviceId();
			}
            break;


            case 'message':
            	// if this flag is set, this notification happened while we were in the foreground.
            	// you might want to play a sound to get the user's attention, throw up a dialog, etc.
            	if (e.foreground){
					// if the notification contains a soundname, play it.
					//var my_media = new Media("/android_asset/www/"+e.soundname);
					//my_media.play();

            		if(app.currentPageId == 'messenger_page'){
            			app.getMessenger();
            		}


            		app.checkNewMessages();

				}
				else
				{	// otherwise we were launched because the user touched a notification in the notification tray.

					if (e.coldstart){
						console.log('COLDSTART NOTIFICATION');
						app.getMessenger();
					}
					else{
						console.log('--BACKGROUND NOTIFICATION--');
						app.getMessenger();
					}

					//app.getMessenger();
				}
            	//console.log('MESSAGE -> MSG: ' + e.payload.message);
            	//console.log('MESSAGE -> MSGCNT: ' + e.payload.msgcnt);
            	//alert(e.payload.message);




            break;

            case 'error':
            	console.log('ERROR -> MSG:' + e.msg);
            break;

            default:
            	console.log('EVENT -> Unknown, an event was received and we do not know what it is');
            break;
        }
    },

    persistGcmDeviceId: function(){
    	$.ajax({
			url: app.apiUrl+'/api/v3/user/gcmDeviceId',
			type: 'Post',
			data: JSON.stringify({
				gcmDeviceId: app.gcmDeviceId
			}),
			success: function(data, status){
				//alert(data.persisting);
			}
		});

    },

    tokenHandler: function(result) {
        //console.log('success:'+ result);
        // Your iOS push server needs to know the token before it can push to this device
        // here is where you might want to send it the token for later use.
    },

    regSuccessGCM: function (result) {
    	//alert('success:'+ result);
    },

    regErrorGCM: function (error) {
    	//alert('error:'+ error);
    },

	back: function(){
		//$.fancybox.close();
		//app.startLoading();
		$(window).unbind("scroll");
		window.scrollTo(0, 0);
		//alert(pagesTracker);
		pagesTracker.splice(pagesTracker.length-1,1);
		//alert(pagesTracker);
		var prevPage = pagesTracker[pagesTracker.length-1];
		//alert(prevPage);

		if(typeof prevPage == "undefined" || prevPage == "main_page" ||  prevPage == "login_page")
			//app.showPage('main_page');
			app.chooseMainPage();
		else
			app.showPage(prevPage);

		if(app.currentPageId == 'users_list_page'){
			app.template = $('#userDataTemplate').html();
			window.scrollTo(0, app.recentScrollPos);
			app.setScrollEventHandler(1000,2000);
		}
		else if(app.currentPageId == 'messenger_page'){
           	app.template = $('#messengerTemplate').html();
           	console.log(app.recentScrollPos);
        	window.scrollTo(0, app.recentScrollPos);
            app.setScrollEventHandler(1000,2000);
        }
        else{
        	var usersListPage = pagesTracker[pagesTracker.length-2];
        	if(usersListPage != 'users_list_page')
        		app.searchFuncsMainCall = true;
        }

		app.searchFuncsMainCall = true;
		app.stopLoading();
	},

	showPage: function(page){
		app.currentPageId = page;
		app.currentPageWrapper = $('#'+app.currentPageId);
		app.container = app.currentPageWrapper.find('.content_wrap');
		if(pagesTracker.indexOf(app.currentPageId)!=-1){
			pagesTracker.splice(pagesTracker.length-1,pagesTracker.indexOf(app.currentPageId));

		}
		if(pagesTracker.indexOf(app.currentPageId) == -1){
			pagesTracker.push(app.currentPageId);
		}
		$('.appPage').hide();
		//alert('1');
		app.currentPageWrapper.show();


		if(app.currentPageId == 'main_page'){
			$('#back').hide();
			$('#sign_up').hide();
			//$('#contact').show();
			$('#likesNotifications').css({left:'auto',right:'0px'}).show();
           	$('#logout').show();
		}
		else if(app.currentPageId == 'login_page'){
			$('#back').hide();
			$('#sign_up').show();
			$('#contact').hide();
			$('#logout').hide();
            $('#likesNotifications').hide();
		}
		else{
			$('#back').show();
			$('#sign_up').hide();
			$('#contact').hide();
			$('#logout').hide();
			document.addEventListener("backbutton", app.back, false);
			$('#likesNotifications').removeAttr('style').show();
		}

		if(app.currentPageId == 'register_page' || app.currentPageId == 'recovery_page'){
          	$('#likesNotifications').hide();
        }
		$(window).unbind("scroll");

	},

	sortByDistance: function(){
		app.sort = 'distance';
		$('#sortByDistance').hide();
		$('#sortByEntranceTime').show();
		app.chooseSearchFunction();
	},

	sortByEntranceTime: function(){
		app.sort = '';
		$('#sortByEntranceTime').hide();
		$('#sortByDistance').show();
		app.chooseSearchFunction();
	},

	chooseSearchFunction: function(){

		app.searchFuncsMainCall = false;

		if(app.action == 'getOnlineNow'){
			app.getOnlineNow();
		}
		else if(app.action == 'getSearchResults'){
			app.search();
		}
		else if(app.action == 'getStatResults'){
			app.getStatUsers(app.statAction);
		}
	},

	getOnlineNow: function(){
		app.startLoading();
		app.showPage('users_list_page');
		app.currentPageWrapper.find('.content_wrap').html('');
		app.template = $('#userDataTemplate').html();
		app.container = app.currentPageWrapper.find('.content_wrap');
		app.container.append('<h1>תוצאות</h1><div class="dots"></div>');
		app.action = 'getOnlineNow';
		app.pageNumber = 1;
		//app.itemsPerPage = 20;
		app.getUsers();
	},


	getUsers: function(){

		if(app.searchFuncsMainCall === true && app.positionSaved === true){
			$('#sortByEntranceTime').hide();
			$('#sortByDistance').show();
			app.sort = '';
		}

		if(app.action == 'getOnlineNow'){
			app.requestUrl = app.apiUrl+'/api/v3/users/online/count:'+app.itemsPerPage+'/page:'+app.pageNumber+'/sort:'+app.sort;
		}
		else if(app.action == 'getSearchResults'){
			//var countryCode = $('#countries_list').val();
			var religionId = $('#search_form_page .religionList select').val();
			var countryRegionId = $('#search_form_page .regionsList select').val();
			//if(regionCode==undefined) regionCode='';
			var ageFrom = $(".age_1 select").val();
			var ageTo = $(".age_2 select").val();
			var nickName = $('.nickName').val();
			//var userGender=$('.gen input[name="gen"]:checked').val();+'/userGender:'+userGender
			app.requestUrl = app.apiUrl+'/api/v3/users/search/religionId:'+religionId+'/countryRegionId:'+countryRegionId+'/age:'+ageFrom+'-'+ageTo+'/nickName:'+nickName+'/count:'+app.itemsPerPage+'/page:'+app.pageNumber+'/sort:'+app.sort;
			//alert(app.requestUrl);
		}
		else if(app.action == 'getStatResults'){

			app.requestUrl = app.apiUrl+'/api/v3/user/statistics/'+app.statAction+'/count:'+app.itemsPerPage+'/page:'+app.pageNumber+'/sort:'+app.sort;
		}

		$.ajax({
			url: app.requestUrl,
			timeout:10000,
			success: function(response, status){
				app.response = response;
				//alert(JSON.stringify(response.users.count));
				if(app.response.users.itemsNumber=='0'&&app.pageNumber==1){
					app.container.append('<h1 style="width:100%;text-align:center;margin-top:20px;">חיפוש הסתיים ללא תוצאות</h1>');
				}else
					app.displayUsers();
			}//,
			//error: function(err){
			//	alert(JSON.stringify(err));
			//}
		});
	},


	displayUsers: function(){

		app.stopLoading();

		if(app.currentPageId == 'users_list_page'){

			$('.loadingHTML').remove();

        	var userId = window.localStorage.getItem("userId");

        	if(app.response.users.itemsNumber == 0){
        		app.container.append('<div class="center noResults">אין תוצאות</div>')
        		return;
        	}

			for(var i in app.response.users.items){
				var currentTemplate = app.template;
				var user = app.response.users.items[i];
				currentTemplate = currentTemplate.replace("[USERNICK]",user.nickName);
				currentTemplate = currentTemplate.replace("[AGE]",user.age);
				//currentTemplate = currentTemplate.replace("[COUNTRY]",user.country+',');
				if(user.city==null)user.city='';
				//alert(user.city);
				currentTemplate = currentTemplate.replace("[CITY]",user.city);
				currentTemplate = currentTemplate.replace("[IMAGE]",user.mainImage.url);
				currentTemplate = currentTemplate.replace(/\[USERNICK\]/g,user.nickName);
				currentTemplate = currentTemplate.replace("[USER_ID]", user.id);
				var aboutUser = user.about;
				//if(aboutUser==null)aboutUser='';
				//if(typeof(user.about) === 'string'){
				//	if(user.about.length > 90){
				//		aboutUser = user.about.substring(0,90)+'...';
				//	}
				//	else{
				//		aboutUser = user.about;
				//	}
				//}
				//alert(aboutUser);

				currentTemplate = currentTemplate.replace("[ABOUT]", aboutUser);
				app.container.append(currentTemplate);
				var currentUserNode = app.container.find(".user_data:last-child");
				//alert(currentUserNode.find('.user_short_txt').css('text-align'));
				currentUserNode.find(".user_short_txt").attr("onclick","app.getUserProfile("+user.id+");");
				currentUserNode.find(".user_photo_wrap").attr("onclick","app.getUserProfile("+user.id+");");
				if(user.isNew == 1){
					currentUserNode.find(".blue_star").show();
				}
				/*
				if(user.isPaying == 1){
					currentUserNode.find(".special3").show();
				}
				*/
				if(user.isOnline == 1){
					currentUserNode.find(".on2").show();
				}else{
					currentUserNode.find(".on1").show();
				}
				if(user.distance != ""){
					currentUserNode.find(".distance_value").show().find("span").html(user.distance);
					app.positionSaved = true;
				}
				if(user.id==window.localStorage.getItem("userId")){currentUserNode.find('.send_mes').hide();}
			}
			//setTimeout(app.stopLoading(), 10000);
			//app.stopLoading();
			app.responseItemsNumber = app.response.users.itemsNumber;
			if(app.responseItemsNumber == app.itemsPerPage){
				var loadingHTML = '<div class="loadingHTML">'+$('#loadingBarTemplate').html()+'</div>';
				$(loadingHTML).insertAfter(currentUserNode);
			}

			app.setScrollEventHandler(2500,3500);

		}
        else{
        	app.pageNumber--;
        }
	},


	setScrollEventHandler: function(min1, min2){
    		$(window).scroll(function(){
    			//var min=2500;

    			min = min1;
    			if($(this).width()>767) min = min2;


    			app.recentScrollPos = $(this).scrollTop();
    			console.log('setScrollEventHandler:' + app.recentScrollPos);
    			console.log(app.recentScrollPos + ':' + app.container.height());
    //			alert(app.recentScrollPos + ' > ' + app.container.height() +' - ' +min);



    			if(app.recentScrollPos >= app.container.height()-min){
    				$(this).unbind("scroll");

    				 //alert(app.recentScrollPos);


    				if(app.responseItemsNumber == app.itemsPerPage){

    					app.pageNumber++;

    					 if(app.currentPageId == 'messenger_page'){
    						 app.getMessenger();
    					 }
    					 else{
    						app.getUsers();
    					 }
    				}
    				//else alert(app.itemsPerPage);
    			}
    		});
    },

	getMyProfileData: function(){
		app.startLoading();
		$("#upload_image").click(function(){
			$("#statistics").hide();
			$("#uploadDiv").css({"background":"#fff"});
			$("#uploadDiv").show();

			$('#get_stat_div').show();
			$('#upload_image_div').hide();
		});
		$("#get_stat").click(function(){
			$("#statistics").show();
			$("#uploadDiv").hide();

			$('#get_stat_div').hide();
			$('#upload_image_div').show();
		});
		var userId = window.localStorage.getItem("userId");
		$.ajax({
			url: app.apiUrl+'/api/v3/user/profile/'+userId,
			success: function(user, status, xhr){
			    //app.alert(JSON.stringify(user.statistics));
				app.showPage('my_profile_page');
				app.container = app.currentPageWrapper.find('.myProfileWrap');
				app.container.find('.txt strong').html(user.nickName+', <span>'+user.age+'</span>');
				app.container.find('.txt strong').siblings('span').text(user.city);
				app.container.find('.txt div').html(user.about);
				app.container.find('.user_pic img').attr("src",user.mainImage.url);
				if(user.isPaying==1){
					app.container.find(".special4").show();
				}
				//console.log(JSON.stringify(user));
				//return;
				var addedToFriends = user.statistics.fav;
				var contactedYou = user.statistics.contactedme;
				var contacted = user.statistics.contacted;
				var addedToBlackList = user.statistics.black;
				var addedYouToFriends = user.statistics.favedme;
				var looked = user.statistics.looked;
				app.container.find(".stat_side").eq(1).find(".items_wrap").eq(0).find(".stat_value").text(addedToFriends);
				app.container.find(".stat_side").eq(0).find(".items_wrap").eq(1).find(".stat_value").text(contacted);
				app.container.find(".stat_side").eq(1).find(".items_wrap").eq(2).find(".stat_value").text(contactedYou);
				app.container.find(".stat_side").eq(1).find(".items_wrap").eq(1).find(".stat_value").text(addedToBlackList);
				app.container.find(".stat_side").eq(0).find(".items_wrap").eq(0).find(".stat_value").text(addedYouToFriends);
				app.container.find(".stat_side").eq(0).find(".items_wrap").eq(2).find(".stat_value").text(looked);
				app.stopLoading();
			}
		});
	},

	getStatUsers: function(statAction){
		app.startLoading();
		app.showPage('users_list_page');
		app.currentPageWrapper.find('.content_wrap').html('');
		app.template = $('#userDataTemplate').html();
		app.container = app.currentPageWrapper.find('.content_wrap');
		app.container.append('<h1>תוצאות</h1><div class="dots"></div>');
		app.pageNumber = 1;
		app.action = 'getStatResults';
		app.statAction = statAction;
		app.getUsers();
	},

	recovery: function(){
		app.showPage('recovery_page');
		app.currentPageWrapper.find('#user').val('');
	},

	sendRecovery: function(){
		var mail = app.currentPageWrapper.find('#user').val();
		var email_pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
        if (!(email_pattern.test(mail))) {
            app.alert('נא להזין כתובת דוא"ל חוקית');
            return false;
        }
        $.ajax({
        	url: app.apiUrl+'/api/v3/recovery/'+mail,
        	success: function(response){
        		//alert(JSON.stringify(response));
        		if(!response.err)
        			app.currentPageWrapper.find('#user').val('');
        		app.alert(response.text);
        	},
        	error: function(err){
				app.alert(JSON.stringify(err));
			}
        });
	},

	getEditProfile: function(){
		$.ajax({
			url: app.apiUrl+'/api/v3/getedit',
			success: function(response){
				//alert(JSON.stringify(response));
				app.response = response.user;
				app.showPage('edit_profile_page');
				app.container = app.currentPageWrapper.find('.edit_wrap');
				app.container.html('');
				app.template = $('#editProfileTemplate').html();
				app.template = app.template.replace(/\[userNick\]/g,response.user.userNick);
				app.template = app.template.replace(/\[userPass\]/g,response.user.userPass);
				app.template = app.template.replace(/\[userEmail\]/g,response.user.userEmail);
				app.template = app.template.replace(/\[userCity\]/g,response.user.userCity);
				if(response.user.userAboutMe==null)response.user.userAboutMe='';
				if(response.user.userLookingFor==null)response.user.userLookingFor='';
				app.template = app.template.replace(/\[userAboutMe\]/g,response.user.userAboutMe);
				app.template = app.template.replace(/\[userLookingFor\]/g,response.user.userLookingFor);
				app.template = app.template.replace(/\[userfName\]/g,response.user.userfName);
				app.template = app.template.replace(/\[userlName\]/g,response.user.userlName);
				app.template = app.template.replace(/\[Y\]/g,response.user.Y);
				app.template = app.template.replace(/\[n\]/g,response.user.n);
				app.template = app.template.replace(/\[j\]/g,response.user.j);
				if(response.user.userGender=='1')
					app.template = app.template.replace(/\[userGenderName\]/g,'גבר');
				else
					app.template = app.template.replace(/\[userGenderName\]/g,'אישה');
				app.container.html(app.template).trigger('create');
				app.getRegions();
				app.getReligions();
				$('#userBirth').html(app.getBithDate()).trigger('create');
				app.container.find('.userGender').html(app.getuserGender()).trigger('create');

			},
			error: function(err){
				//alert(JSON.stringify(err));
			}
		});
	},

    getuserGender: function(){
    	var html = '<select name="userGender" data-iconpos="left" id="userGender">';
    	html = html + '<option value="1"';
    	if(app.response .userGender=='1')
    		html = html + ' selected="selected" ';
    	html = html + '>גבר</option>';
    	html = html + '<option value="0"';
    	if(app.response .userGender=='0')
    		html = html + ' selected="selected" ';
    	html = html + '>אישה</option></select>';
    	return html;
    },


	saveProf: function (el,tag){
		var name = '';
		var val = '';
		var input = $(el).parent().find(tag);
		var valInput = '';

		if(input.size()=='3'){
			var er=false;
			val = input.eq(2).val()+'-'+input.eq(1).val()+'-'+input.eq(0).val();
			valInput = input.eq(0).val()+'-'+input.eq(1).val()+'-'+input.eq(2).val();
			input.each(function(index){
				//if(index!='0')val=val+'-';
				//val=val+$(this).val();
				if($(this).val().length==0){
				   alert('אנא תמאו ת. לידה');
				   er=true;
				}
			});
			if(er)return false;
			name = 'userBirthday';
		}else{
			name = input.attr('name');
			val = input.val();
		}
		//alert(name+'='+val);//return false;
		if(name=='userPass'&&(val.length < 6||$('#userPass2').val()!=val)){
			if(val.length < 6)
				alert('סיסמה קצרה מדי');
			if($('#userPass2').val()!=val)
				alert('מספר נתונים אינם תקינים: סיסמה או סיסמה שנית');
			return false;
		}
		if((val.length < 3 && tag != 'select' && name != 'userGender')||( val.length==0 && (tag=='select' || name == 'userGender' ))){
			alert($(el).parent().parent().prev().find('span').text()+' קצר מדי');
			return false;
		}
		var email_pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
		if (!(email_pattern.test(val))&&name=='userEmail') {
			alert("כתובת הדואר האלקטרוני שהזנת אינה תקינה");
			return false;
		}

		if($(el).parent().find('.userFailed').length > 0&&$(el).parent().find('.userFailed').is(":visible"))
			return false;





		console.log("Abort checkNewMessagesRequest");
		checkNewMessagesRequest.abort();
		clearTimeout(newMessages);



		app.startLoading();
		//alert(name+'='+val);
		$.ajax({
		   url: app.apiUrl+'/api/v3/saveprofile',
		   //dataType: 'json',
		   type: 'post',
		   data: JSON.stringify({name:name,val:val}),
		   contentType: "application/json; charset=utf-8",
		   success : function(res){


			   if(res.err != '1'){
			       console.log(JSON.stringify(res));

			       console.log("Abort checkNewMessagesRequest");
			       checkNewMessagesRequest.abort();
			       clearTimeout(newMessages);

			       var user = app.container.find("#Nick").val();
			       var pass = app.container.find("#userPass").val();
			       console.log("USERNAME: " + user);
			       console.log("PASSWORD: " + pass);
			       user = unescape(encodeURIComponent(user));
			       pass = unescape(encodeURIComponent(pass));
			       window.localStorage.setItem("user",user);
			       window.localStorage.setItem("pass",pass);
			   }

			   app.ajaxSetup();
			   app.checkNewMessages()


			   app.stopLoading();
			   //alert(JSON.stringify(res));return false;
			   if(res.err == '1'){
				    //check(input.attr('id'),val);
				    input.val(res.val);
				    $('#edit_profile_page').trigger('refresh');
				    alert(res.text);
				    //$(el).parent().find('.input').css({'background':'red'});
			   }else if(res.res == '1'){
				    //alert(val);
				    alert('עדכון נשמר');
				    if(tag=='select'&&name!='userBirthday'&&name!='userGender'){
					    val = $(el).parent().find('.ui-select span').eq(1).text();
					    //alert(val);
				    }
				    if(val=='0'&&name=='userGender')val = 'אישה';
				    if(val=='1'&&name=='userGender')val = 'גבר';
				    if(name=='userBirthday') val=valInput.replace(/-/g,' / ');
				    if(name=='userPass')
					    $(el).parent().next().find('input').val(val);
				    else{
				        input.val(res.val);
                        if(tag == 'select'){
                            $(el).parent().next().find('div').text(input.find('option[value="' + res.val + '"]').text());
                        }else{
                            $(el).parent().next().find('div').text(res.val);
                        }
				    }
                    $('.save').hide();
                    $('.edit').show();
			   }
		   },

		   error: function(err){
			   app.stopLoading();
			   //alert(JSON.stringify(err));
			   $('.save').hide();
			   $('.edit').show();
		   }
		});
	},


    editProf: function (el){
       var name = $(el).attr('name');
       if(name=='edit'){
          $('.save').hide();
          $('.edit').show();
          //alert($('.sf_sel_wrap .edit').size());
          $(el).parent().hide().prev().show();
       }else{
          $(el).parent().hide().next('.edit').show();
       }
    },

	getSearchForm: function(){
		app.startLoading();
		app.showPage('search_form_page');
		app.getRegions();
		app.getReligions();
		app.searchFuncsMainCall = true;
		//app.getSexPreference();
		//$("#regions_wrap").hide();
		//app.getCountries();
		var html = '<select data-iconpos="left">';
		for(var i = 18; i <= 80; i++){
			html = html + '<option value="' + i + '"">' + i + '</option>';
		}
		html = html + '</select>';

		$(".age_1").html(html);
		$(".age_1").trigger("create");

		var html = '<select data-iconpos="left">';
		var sel = '';
		for(var i = 19; i <= 80; i++){
			if(i == 40) sel = ' selected="selected"';
			else sel = '';
			html = html + '<option value="' + i + '"' + sel + '>' + i + '</option>';
		}
		html = html + '</select>';
		$(".age_2").html(html);
		$(".age_2").trigger("create");
		//app.formchange(true,'region');
		app.stopLoading();
	},

/*	getSexPreference: function(){
		$.ajax({
			url: 'http://m.ricosybellas.com/api/v1/list/sexPreference',
			success: function(list, status, xhr){
				var html = '';
				if(app.currentPageId == 'register_page'){
					for(var i in list.items){
						var item = list.items[i];
						html = html + '<option value="' + item.sexPrefId + '">' + item.sexPrefName + '</option>';
					}
					$(".sexPreferenceList").html(html);
					$(".sexPreferenceList").val($(".sexPreferenceList").val());
					$(".sexPreferenceList").find("option[value='1']").insertBefore($(".sexPreferenceList").find("option:eq(0)"));
					$(".sexPreferenceList").val($(".sexPreferenceList").find("option:first").val()).selectmenu("refresh");
				}else if(app.currentPageId == 'search_form_page'){
					for(var i in list.items){
						var item = list.items[i];
						html = html + '<input type="checkbox" id="check-sex' + item.itemId  + '" value="' + item.itemId  + '"><label for="check-sex' + item.itemId  + '">' + item.itemName + '</label>';
					}
					$(".sexPreferenceList fieldset").html(html);
					$(".sexPreferenceList").trigger("create");
				}

			}

		});
	},*/

	injectCountries: function(html, container){
		container.html(html);
		container.trigger('create');
		container.find("option[value='US']").insertBefore(container.find("option:eq(0)"));
		container.find("option[value='CA']").insertBefore(container.find("option:eq(1)"));
		container.find("option[value='AU']").insertBefore(container.find("option:eq(2)"));
		container.find("option[value='GB']").insertBefore(container.find("option:eq(3)"));
		container.val(container.find("option:first").val()).selectmenu("refresh");
	},

	/*getCountries: function(){
		$.ajax({
			url: app.apiUrl+'/api/v3/list/country',
			success: function(list, status, xhr){
				var html = '<select name="countryCode" onchange="app.getRegions($(this).val());" data-iconpos="right">';
				html = html + '<option value=""></option>';//Seleccione un país
				if(list.itemsNumber > 0){
					for(var i in list.items){
						var item = list.items[i];
						html = html + '<option value="' + item.countryCode + '">' + item.countryName + '</option>';
					}
					html = html + '</select>';
					app.container.find(".countryList").html(html).trigger('create');
				}
			}
		});
	},*/

	getRegions: function(){
		$.ajax({
			url: app.apiUrl+'/api/v3/list/regions',
			success: function(list, status, xhr){
				//alert(JSON.stringify(list));
				var html = '<select name="countryRegionId" data-iconpos="left" id="countryRegionId">';
				if(app.currentPageId == 'search_form_page'){
					html = html + '<option value="">לא חשוב</option>';
				}
				if(app.currentPageId == 'register_page'){
                	html = html + '<option value="">בחרו</option>';
                }
				app.container.find(".regionsList").html('');
				if(list.itemsNumber > 0){
					for(var i in list.items){
						var item = list.items[i];
						html = html + '<option value="' + item.itemId + '"';
						if(app.currentPageId == 'edit_profile_page'&&item.itemId==app.response.countryRegionId){
							html = html + ' selected="selected" ';
							app.container.find(".regionsList").parent().next().children('div').text(item.itemName);
						}
						html = html + '>' + item.itemName + '</option>';
					}
					html = html + '</select>';
					app.container.find(".regionsList").html(html).trigger('create');
					//app.container.find("#regions_wrap").show();

				}else{
				}

			},
			//error: function(response, textStatus, errorThrown){
			//	app.stopLoading();
			//	alert(response.status + ':' + errorThrown );
			//},
		});
	},

	getReligions: function(){
		$.ajax({
			url: app.apiUrl+'/api/v3/list/religions',
			success: function(list, status, xhr){
				//alert(JSON.stringify(list));
				var html = '<select name="religionId" data-iconpos="left"  id="religionId">';
				if(app.currentPageId == 'search_form_page'){
					html = html + '<option value="">לא חשוב</option>';
				}
				if(app.currentPageId == 'register_page'){
					html = html + '<option value="">לבחור השקפה</option>';
				}
				app.container.find(".religionList").html('');
				//app.container.find("#cities_wrap").hide();
				//app.container.find(".citiesList").html('');
				if(list.itemsNumber > 0){
					for(var i in list.items){
						var item = list.items[i];
						html = html + '<option value="' + item.itemId + '"';
						if(app.currentPageId == 'edit_profile_page'&&item.itemId==app.response.religionId){
							html = html + ' selected="selected" ';
							app.container.find(".religionList").parent().next().children('div').text(item.itemName);
						}
						html = html + '>' + item.itemName + '</option>';
					}
					html = html + '</select>';
					app.container.find(".religionList").html(html).trigger('create');
					//app.container.find("#regions_wrap").show();
					/*
					if(app.currentPageId == 'register_page'){
						app.container.find('.regionsList select').change(function(){
							app.getCities(app.container.find("#countries_list").val(),$(this).val());
						});
					}
					*/
				}
				else{
					/*var html = '<input type="text" name="cityName" id="cityName" />';
					app.container.find(".citiesList").html(html);
					app.container.find("#cities_wrap").show();*/
				}

			}//,
			//error: function(response, textStatus, errorThrown){
				//app.stopLoading();
				//alert(response.status + ':' + errorThrown );
			//},
		});
	},
	/*getRegions: function(countryCode){
		if(countryCode!==''){
			$.ajax({
				url: app.apiUrl+'/api/v3/list/regions/'+countryCode,
				success: function(list, status, xhr){
					var html = '<select name="regionCode" onchange="app.getCities(\''+countryCode+'\',$(this).val());" data-iconpos="right">';
					//if(app.currentPageId == 'search_form_page'){
						html = html + '<option value=""></option>';
					//}
					if(list.itemsNumber > 0){
						app.formchange(true,'region');
						app.container.find(".regionsList").html('');
						for(var i in list.items){
							var item = list.items[i];
							html = html + '<option value="' + item.regionCode + '">' + item.regionName + '</option>';
						}
						html = html + '</select>';
						app.container.find(".regionsList").html(html).trigger('create');
					}
					else{
						app.formchange(false,'region');
					}
				}
			});
		}else{
			app.formchange(true,'region');
		}
	},*/

	/*formchange: function(flag,get){
		if(flag){
			app.container.find(".cityInp").hide();
			app.container.find("#userCityName").val('');
			app.container.find(".citiesList").html("<sp>Seleccione una area</sp>").show();
			if(get=='region')app.container.find(".regionsList").html("<sp>Seleccione un país</sp>").show();
			app.container.find("#regions_wrap").show();
		}else{
			app.container.find(".cityInp").show();
			app.container.find(".citiesList, .regionsList, #regions_wrap").hide();
			app.container.find(".regionsList select,.citiesList select").val('');
		}
	},*/

	/*getCities: function(countryCode,regionCode){
		if(regionCode!==''){
			$.ajax({
				url: app.apiUrl+'/api/v3/list/cities/'+countryCode+'/'+regionCode,
				success: function(list, status, xhr){
					//alert( JSON.stringify(list));
					if(list.itemsNumber > 0){
						app.formchange(true,'city');
						app.container.find(".citiesList").html('');
						var html = '<select name="userCity" id="userCity" data-iconpos="right">';
						html = html + '<option value=""></option>';
						for(var i in list.items){
							var item = list.items[i];
							html = html + '<option value="' + item.cityName + '">' + item.cityName + '</option>';
						}
						html = html + '</select>';
						app.container.find(".citiesList").html(html).trigger('create');
					}
					else{
						app.formchange(false,'city');
					}
				}
			});
		}else{
			app.formchange(true,'city');
		}
	},*/

	sendRegData: function(){
		if(app.formIsValid()){
			var data = JSON.stringify(
				$('#regForm').serializeObject()
			);
			//alert(data);
			$.ajax({
				url: app.apiUrl+'/api/v3/user',
				type: 'Post',
				data: data,
				success: function(response){
					app.response = response;
					console.log( JSON.stringify(app.response));
					if(app.response.result > 0){
						var userInput = app.container.find("#userEmail").val();
						var pass = app.container.find("#userPass").val();
						user = unescape(encodeURIComponent(userInput));
                        pass = unescape(encodeURIComponent(pass));
						window.localStorage.setItem("user",user);
						window.localStorage.setItem("pass",pass);
						window.localStorage.setItem("userId", app.response.result);
						window.localStorage.setItem("userInput", userInput);
						app.ajaxSetup();
						app.getRegStep();
					}
					else{
						/*
						if(app.response.err=='{=/membersdata/errors/existinngnick}')
							app.response.err='שם המשתמש שבחרתם קיים במערכת. אנא בחרו שם חדש';
						if(app.response.err=='{=/membersdata/errors/existinngemail}')
							app.response.err='אימייל שבחרתם קיים במערכת. אנא בחרו שם חדש';
						*/
                        for(var key in app.response.user){
                        	$('#regForm #' + key).val(app.response.user[key]);
                        }
						app.alert($('<div>'+app.response.err+'</div>').text());
						$('#regForm').trigger('refresh');

					}
				}
				,error: function(error){
					console.log( JSON.stringify(error));
				}
			});


		}

	},

	getRegStep: function(){
		//$('#test_test_page').show();
		app.showPage('upload_image_page');
		app.container.find('.regInfo').text('יש באפשרותך להעלות עד 4 תמונות מסוג jpeg בלבד. תמונות חדשות ממתינות לאישור האתר.');  // Also you may upload an image in your profile now.
		window.scrollTo(0,0);
	},

	formIsValid: function(){
		var email_pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
		if (!(email_pattern.test($('#userEmail').val()))) {
			app.alert('דוא"ל שגוי');
			return false;
		}

		if ($('#userPass').val().length < 4 || $('#userPass').val().length > 12) {
			app.alert("סיסמה שגויה (אמור להיות 4-12 סימנים)");
			$('#userPass').focus();
			return false;
		}
		if ($('#userPass').val() != $('#userPass2').val()) {
			app.alert("טעות בסיסמה שנית");
			$('#userPass2').focus();
			return false;
		}
		if (app.container.find('#userNick').val().length < 3) {
			app.alert('כינוי שגוי (אמור להיות 3 סימנים לפחות)');
			//$('#userNic').focus();
			return false;
		}

		if(app.container.find('#userGender').val() == ''){
			app.alert('מין שגוי');
			return false;
		}

		if(!app.container.find('#userfName').val().length){
			app.alert('שם פרטי שגוי');
			return false;
		}
		if(!app.container.find('#userlName').val().length){
			app.alert('שם משפחה שגוי');
			return false;
		}

		if(!$('#d').val().length || !$('#m').val().length || !$('#y').val().length){
			app.alert('תאריך לידה שגוי');
			return false;
		}

		if (!app.container.find('.regionsList select').val().length) {
			app.alert('איזור שגוי');
			return false;
		}

		if(!app.container.find('#userCity').val().length){
			app.alert('עיר שגויה');
			return false;
		}

		if (!app.container.find('.maritalStatusList select').val().length) {
			app.alert('מצב משפחתי שגוי');
			return false;
		}

		if (!app.container.find('.childrenList select').val().length) {
			app.alert('מספר ילדים שגוי');
			return false;
		}

		if(!app.container.find('.religionList select').val().length){
			app.alert('השקפה שגויה');
			return false;
		}

		if (!app.container.find('.educationList select').val().length) {
			app.alert('השכלה שגויה');
			return false;
		}

		if (!app.container.find('.occupationList select').val().length) {
			app.alert('עיסוק שגוי');
			return false;
		}





		if (!app.container.find('.heightList select').val().length) {
			app.alert('גובה שגוי');
			return false;
		}

		if (!app.container.find('.bodyTypeList select').val().length) {
			app.alert('מבנה גוף שגוי');
			return false;
		}

		if (!app.container.find('.eyesColorList select').val().length) {
			app.alert('צבע עיניים שגוי');
			return false;
		}

		if (!app.container.find('.hairColorList select').val().length) {
			app.alert('צבע השיער שגוי');
			return false;
		}

		if (!app.container.find('.hairLengthList select').val().length) {
			app.alert('תסרוקת שגויה');
			return false;
		}

		if (!app.container.find('.smokingList select').val().length) {
			app.alert('הרגלי עישון שגויים');
			return false;
		}


		if(app.container.find('#aboutMe').val().length < 10){
			app.alert('על עצמי שגוי (אמור להיות 10 סימנים לפחות)');
			return false;
		}

		if(app.container.find('#lookingFor').val().length < 10){
			app.alert('את מי אני מחפש/ת שגוי (אמור להיות 10 סימנים לפחות)');
			return false;
		}

		if(!app.container.find('.lookingForList input[type="checkbox"]:checked').size()){
			app.alert('מה אני מחפש/ת שגוי');
			return false;
		}

		if(!app.container.find('#confirm').is(":checked")){
			app.alert('אנא סמנו בתיבה');
			return false;
		}

		return true;
	},



	/*
	formIsValid: function(){
		var text='';
		if(app.container.find('#userNick').val().length == 0){
			app.container.find('#userNick').css({'background':'red'});
			if(text==''){
				text='אנא הזינו שם משתמש';
				app.container.find('#userNick').focus();
			}
			//return false;
		}
		if(app.container.find('#wrong_userNick').val()=='true'){
			app.container.find('#userNick').css({'background':'red'});
			if(text==''){
				text='שם המשתמש שבחרתם קיים במערכת. אנא בחרו שם חדש.';
				app.container.find('#userNick').focus();
			}
		}
		var email_pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
		if (!(email_pattern.test(app.container.find('#userEmail').val()))) {
			app.container.find('#userEmail').css({'background':'red'});
			if(text==''){
				text="כתובת הדואר האלקטרוני שהזנת אינה תקינה";
				app.container.find('#userEmail').focus();
			}
			//return false;
		}
		if(app.container.find('#wrong_userEmail').val()=='true'){
			app.container.find('#userNick').css({'background':'red'});
			if(text==''){
				text='כתובת הדואר האלקטרוני שבחרתם קיים במערכת. אנא בחרו אימייל חדש.';
				app.container.find('#userNick').focus();
			}
		}

		if (app.container.find('#userPass').val().length < 6 || app.container.find('#userPass').val().length > 12) {
			app.container.find('#userPass').css({'background':'red'});
			if(text==''){
				text="סיסמה שגויה (אמור להיות 6-12 סימנים)";
				app.container.find('#userPass').focus();
			}
			//return false;
		}
		if (app.container.find('#userPass2').val().length < 6 || app.container.find('#userPass2').val().length > 12) {
			app.container.find('#userPass2').css({'background':'red'});
			if(text==''){
				text="סיסמה בשנית שגויה (אמור להיות 6-12 סימנים)";
				app.container.find('#userPass2').focus();
			}
			//return false;
		}
		if (app.container.find('#userPass').val() != app.container.find('#userPass2').val()) {
			app.container.find('#userPass2').css({'background':'red'});
			if(text==''){
				text="סיסמה שהוקלדה בשנית לא תואמת לסיסמה הראשונה";
				app.container.find('#userPass2').focus();
			}
			//return false;
		}

		if(app.container.find('#userGender').val() == ''){
			app.container.find('#userGender').parent().css({'background':'red'}).attr('onclick','$(this).attr("style","");');
			if(text==''){
				text='אנא הזינו מין';
				app.container.find('#userGender').focus();
			}
			//return false;
		}

		if(app.container.find('#countryRegionId').val() == ''){
			app.container.find('#countryRegionId').parent().css({'background':'red'}).attr('onclick','$(this).attr("style","");');
			if(text==''){
				text='אנא הזינו איזור';
				app.container.find('#countryRegionId').focus();
			}
			//return false;
		}

		if(app.container.find('#userCityName').val().length == 0){
			app.container.find('#userCityName').css({'background':'red'});
			if(text==''){
				text='אנא הזינו עיר';
				app.container.find('#userCityName').focus();
			}
			//return false;
		}
		if(app.container.find('#religionId').val().length == 0){
			app.container.find('#religionId').parent().css({'background':'red'}).attr('onclick','$(this).attr("style","");');
			if(text==''){
				text='אנא הזינו השקפה';
				app.container.find('#religionId').focus();
			}
			//return false;
		}
		if(app.container.find('#userfName').val().length == 0){
			app.container.find('#userfName').css({'background':'red'});
			if(text==''){
				text='אנא הזינו שם פרטי';
				app.container.find('#userfName').focus();
			}
			//return false;
		}
		if(app.container.find('#userlName').val().length == 0){
			app.container.find('#userlName').css({'background':'red'});
			if(text==''){
				text='אנא הזינו שם משפחה';
				app.container.find('#userlName').focus();
			}
			//return false;
		}
		if(app.container.find('#d').val().length == 0 || app.container.find('#m').val().length == 0 || app.container.find('#y').val().length == 0){
			if(app.container.find('#d').val().length == 0){
				app.container.find('#d').parent().css({'background':'red'}).attr('onclick','$(this).attr("style","");');
				//$('#d').focus();
			}
			if(app.container.find('#m').val().length == 0){
				app.container.find('#m').parent().css({'background':'red'}).attr('onclick','$(this).attr("style","");');
				//$('#m').focus();
			}
			if(app.container.find('#y').val().length == 0){
				app.container.find('#y').parent().css({'background':'red'}).attr('onclick','$(this).attr("style","");');
				//$('#y').focus();
			}
			if(text==''){
				text='אנא הזינו תאריך לידה';
			}
			//return false;
		}
		if(text!=''){
			alert(text);
			return false;
		}

		return true;
	},
	*/



	delRed: function(el){
		$(el).attr('style','');
	},


	sendMessageToAdmin: function(){

		var userId = window.localStorage.getItem("userId");
		var messageToAdmin = $('#messageToAdmin').val();

		if(!messageToAdmin.length){
			return;
		}

		app.startLoading();

		$.ajax({
		   url: app.apiUrl+'/api/v3/contactUs',
		   type: 'Post',
		   contentType: "application/json; charset=utf-8",
		   data: JSON.stringify({
				userId: userId,
				messageToAdmin: messageToAdmin,
			}),
		   error: function(error){
			   alert(JSON.stringify(error));
			   app.stopLoading();
		   },
		   success: function(response, status, xhr){
			   app.stopLoading();
			   $('#messageToAdmin').val('');
			   app.alert('תודה. ההודעה נשלחה');
			   app.back();
		   }
		});
	},




	search: function(pageNumber){
		app.startLoading();
		app.showPage('users_list_page');
		app.template = $('#userDataTemplate').html();
		app.container = app.currentPageWrapper.find('.content_wrap');
		app.container.html('');
		app.container.append('<h1>תוצאות</h1><div class="dots"></div>');
		app.pageNumber = 1;
		app.action = 'getSearchResults';
		app.getUsers();
	},

	reportAbuse: function(){

		var abuseMessage = $('#abuseMessage').val();

		$.ajax({
		   url: app.apiUrl+'/api/v3/user/abuse/'+app.reportAbuseUserId,
		   type: 'Post',
		   contentType: "application/json; charset=utf-8",
		   data: JSON.stringify({abuseMessage: abuseMessage}),
		   error: function(response){

			   //alert(JSON.stringify(response));

		   },
		   success: function(response, status, xhr){
			   $('#abuseMessage').val('');
			   app.alert('תודה. ההודעה נשלחה.');
			   app.back();
		   }
		});
	},

	manageLists: function(list, act, userId){
        app.startLoading();
        $.ajax({
            url: app.apiUrl+'/api/v3/user/managelists/'+ list + '/' + act + '/' + userId,
            type: 'Post',
            contentType: "application/json; charset=utf-8",
            error: function(response){
           		alert(JSON.stringify(response));
           	},
            success: function(response, status, xhr){

                //alert(JSON.stringify(response));
                //return;

                if(response.success){
                    app.alert(response.success);
                    app.container.find('.' + list + act).hide();
                    if(act == '1'){
                        app.container.find('.' + list + '0').show();
                    }else{
                        app.container.find('.' + list + '1').show();
                    }
                }
                app.stopLoading();
            }
        });
    },

	getUserProfile: function(userId){
		if(userId==window.localStorage.getItem("userId")){app.getMyProfileData(); return;}
		app.ajaxSetup();
		app.startLoading();

		$.ajax({
			url: app.apiUrl+'/api/v3/user/profile/'+userId,
			type: 'Get',
			   error: function(error){
			   console.log(JSON.stringify(error));
			   },
			success: function(user, status, xhr){

			    app.reportAbuseUserId = userId;
			    $('.my-gallery').html('');
				app.showPage('user_profile_page');
				window.scrollTo(0, 0);
				var detailsContainer = app.container.find('#user_details');
				app.container.find(".special3, .blue_star, .on5, .pic_wrap").hide();

				//app.container.find('.pic_wrap').addClass("left").removeClass("center");
				//app.container.find('#pic1').parent('a').addClass("fancybox");

			    app.container.find("h1 span").text(user.nickName);


			   /*
				app.container.find('#pic1').attr("src",user.mainImage).parent('a').attr({"href":user.mainImage, "rel":"images_"+user.userId});
				if(user.mainImage == "images/0.jpg"
				|| user.mainImage == "images/1.jpg"){
					app.container.find('#pic1').parent('a').removeClass("fancybox").attr("href","#");
				}
				app.container.find('.pic_wrap').eq(0).show();
				app.container.find('.fancybox').fancybox();
				if(typeof user.otherImages[0] !== "undefined"){
					//alert(user.otherImages[0]);
					app.container
						.find('.pic_wrap').eq(1).show()
						.find("img").attr("src",user.otherImages[0])
						.parent('a')
						.attr({"href":user.otherImages[0], "rel":"images_"+user.userId});
				}else{
					app.container.find('.pic_wrap').eq(0).addClass("center").removeClass("left");
				}
				if(typeof user.otherImages[1] !== "undefined"){
					//alert(user.otherImages[1]);
					app.container.find('.pic_wrap').eq(2).show()
						.find("img").attr("src",user.otherImages[1])
						.parent('a').attr({"href":user.otherImages[1], "rel":"images_"+user.userId});
				}
				*/


			   if(user.mainImage.size.length){
			   $('.noPicture').hide();
			   var userPhotoTemplate = $('#userPhotoTemplate').html().replace(/\[ID\]/g,'pic1');
			   $(userPhotoTemplate).appendTo('.my-gallery');
			   app.container.find('#pic1').attr("src",user.mainImage.url).parent('a').attr({"href":user.mainImage.url, "data-size": user.mainImage.size});
			   app.container.find('.pic_wrap').eq(0).show();
			   }
			   else{
			   $('.noPicture img').attr("src",user.mainImage.url);
			   $('.noPicture').show();
			   }


			   if(typeof user.otherImages[0] !== "undefined"){
			   app.proccessUserPhotoHtml(user,1);

			   }else{
			   app.container.find('.pic_wrap').addClass("center");
			   }

			   if(typeof user.otherImages[1] !== "undefined"){
			   app.proccessUserPhotoHtml(user,2);
			   }


			   initPhotoSwipeFromDOM('.my-gallery');



				/*
				if(user.isPaying == 1){
					app.container.find(".special3").show();
				}
				*/
				if(user.isNew == 1){
					app.container.find(".blue_star").show();
				}
				if(user.isOnline == 1){
					app.container.find(".on5").show();
				}
				if(user.distance != ""){
					app.container.find(".distance_value").show().css({'right':($('#user_pictures .pic_wrap').width()*0.9-$('#user_pictures .distance_value').width())/2+'px'}).find("span").html(user.distance);
				}else{
					app.container.find(".distance_value").hide().find("span").html(user.distance);
				}
				app.profileGroupTemplate = $('#userProfileGroupTemplate').html();
				app.profileLineTemplate = $('#userProfileLineTemplate').html();
				app.profileLineTemplate2 = $('#userProfileLineTemplate2').html();


			   /*
				var profileButtonsTemplate = $('#userProfileButtonsTemplate').html();
				profileButtonsTemplate = profileButtonsTemplate.replace(/\[USERNICK\]/g,user.nickName);
				profileButtonsTemplate = profileButtonsTemplate.replace("[USER_ID]", user.userId);
			   var html = profileButtonsTemplate;
				*/



			   if(user.userId != window.localStorage.getItem('userId')){
				   var profileButtonsTemplate = $('#userProfileButtonsTemplate').html();
				   var profileButtonsTemplate_2 = $('#userProfileButtonsTemplate_2').html();
				   profileButtonsTemplate = profileButtonsTemplate.replace(/\[USERNICK\]/g,user.nickName);
                   profileButtonsTemplate = profileButtonsTemplate.replace(/\[USER_ID\]/g, user.userId);
                   profileButtonsTemplate_2 = profileButtonsTemplate_2.replace(/\[USER_ID\]/g, user.userId);
			   }
			   else{
				   var profileButtonsTemplate = '';
				   var profileButtonsTemplate_2 = '';
			   }

			   var html = profileButtonsTemplate;


				if(!((user.eyesColor== undefined || user.eyesColor=='') && (user.bodyType== undefined || user.bodyType=='') && (user.hairColor== undefined || user.hairColor=='') && (user.hairLength== undefined || user.hairLength=='') && (user.breast== undefined || user.breast=='')))
					html = html + app.getProfileGroup("מראה חיצוני");
				if(user.eyesColor!== undefined && user.eyesColor!=='')html = html + app.getProfileLine("צבע עיניים", user.eyesColor);
				if(user.userHeight!== undefined && user.userHeight!=='')html = html + app.getProfileLine("גובה", user.userHeight);
				if(user.bodyType!== undefined && user.bodyType!=='')html = html + app.getProfileLine("מבנה גוף", user.bodyType);
				if(user.hairColor!== undefined && user.hairColor!=='')html = html + app.getProfileLine("צבע שיער", user.hairColor);
				if(user.hairLength!== undefined && user.hairLength!=='')html = html + app.getProfileLine("תסרוקת", user.hairLength);
				if(user.breast!== undefined && user.breast!=='')html = html + app.getProfileLine("גודל חזה", user.breast);
				html = html + app.getProfileGroup("מידע בסיסי");
				//html = html + app.getProfileLine("Nickname", user.nickName);
				if(user.age!== undefined && user.age!=='')html = html + app.getProfileLine("גיל", user.age);
				if(user.zodiak !== undefined && user.zodiak !== '') html = html + app.getProfileLine("מזל", user.zodiak);
				//html = html + app.getProfileLine("נטיה מינית", user.sexPreference);
				//html = html + app.getProfileLine("נסיון עם נשים", user.experience);
				//if(user.country!== undefined && user.country!=='')html = html + app.getProfileLine("País de Nacimiento", user.country);
				if(user.region!== undefined && user.region!=='' && user.region!==null)html = html + app.getProfileLine("אזור מגורים", user.region);
				if(user.city!== undefined && user.city!=='' && user.city!==null)html = html + app.getProfileLine("עיר מגורים", user.city);
				if(user.smoking!== undefined && user.smoking!=='')html = html + app.getProfileLine("עישון", user.smoking);
				if(user.maritalStatus !== undefined && user.maritalStatus !== '') html = html + app.getProfileLine("מצב משפחתי", user.maritalStatus);
                if(user.children !== undefined && user.children !== '') html = html + app.getProfileLine("מספר ילדים", user.children);
				if(user.education!== undefined && user.education!=='')html = html + app.getProfileLine("השכלה", user.education);
				if(user.occupation!== undefined && user.occupation!=='')html = html + app.getProfileLine("עיסוקי", user.occupation);
				if(user.religion!== undefined && user.religion!=='')html = html + app.getProfileLine("דתי", user.religion);
				if(user.lookingForIds !== undefined && user.lookingForIds !== '') html = html + app.getProfileLine("מה אני מחפש/ת", user.lookingForIds);
				//if(user.economy!== undefined && user.economy!=='')html = html + app.getProfileLine("Situación Económica", user.economy);
				//html = html + app.getProfileLine("דתי", user.religion);
				if(user.about!== undefined && user.about!=='' && user.about!=null){
					html = html + app.getProfileGroup("מעט עלי");
					html = html + app.getProfileLine("", user.about);
				}
				if(user.lookingFor!== undefined && user.lookingFor!=='' && user.lookingFor!=null){
					html = html + app.getProfileGroup("אני מחפשת");
					html = html + app.getProfileLine("", user.lookingFor);
				}
				//if((user.hobbies!== undefined && user.hobbies!=='')&&(user.music!== undefined && user.music!=='')){
				//	html = html + app.getProfileGroup("Más información sobre mí");
				//	if(user.hobbies!== undefined && user.hobbies!=='')html = html + app.getProfileLine("Mis intereses", user.hobbies);
				//	if(user.music!== undefined && user.music!=='')html = html + app.getProfileLine("My Music", user.music);
				//}


				html = html + profileButtonsTemplate + profileButtonsTemplate_2;

				detailsContainer.html(html).trigger('create');

				var hideFavButton = 0;
                if(user.is_in_favorite_list){
                	hideFavButton = 1;
                }
                var hideBlackButton = 0;
                if(user.is_in_black_list){
                	hideBlackButton = 1;
                }
                detailsContainer.find('.favi'  + hideFavButton).hide();
                detailsContainer.find('.black'  + hideBlackButton).hide();

				app.container.find('.pic_wrap').click(function(){
                	document.removeEventListener("backbutton", app.back, false);
                    document.addEventListener("backbutton", app.closeUserGallery, false);
                });


				app.stopLoading();
			}
		});
	},

	closeUserGallery: function(){
    	$('.pswp__button--close').click();
    },




	proccessUserPhotoHtml: function(user,index){

		var userPhotoTemplate = $('#userPhotoTemplate').html().replace(/\[ID\]/g,'pic' + index + 1);
		$(userPhotoTemplate).appendTo('.my-gallery');

		var imageSize = (user.otherImages[index-1].size.length) ? user.otherImages[index-1].size : '1x1' ;

		console.log("SIZE of " + user.otherImages[index-1].url + ":" + imageSize);

		app.container
		.find('.pic_wrap')
		.css({"float": "left"})
		.eq(index)
		.show()
		.find('img')
		.show()
		.attr("src",user.otherImages[index-1].url)
		.parent('a')
		.attr({"href": user.otherImages[index-1].url, "data-size": imageSize});
	},


	getProfileGroup: function(groupName){
		var group = app.profileGroupTemplate;
		return group.replace("[GROUP_NAME]", groupName);
	},

	getProfileLine: function(lineName, lineValue){
		if(lineName != ""){
			var line = app.profileLineTemplate;
			line = line.replace("[LINE_NAME]", lineName);
		}
		else{
			var line = app.profileLineTemplate2;
		}
		line = line.replace("[LINE_VALUE]", lineValue);
		return line;
	},

	getMessenger: function(){

		if(app.pageNumber == 1){
			window.scrollTo(0, 0);
        	app.startLoading();
        }

        //app.itemsPerPage = 20;

		$.ajax({
			url: app.apiUrl + '/api/v3/user/contacts/perPage:' + app.itemsPerPage + '/page:' + app.pageNumber,
			complete: function(event, xhr, settings){
				//console.log("ERR: " + JSON.stringify(event + xhr + settings));
			},
			error: function(response){
				console.log("ERR: " + JSON.stringify(response));
			},
			success: function(response){
   				console.log(JSON.stringify(response));

				app.response = response;
				//if(pagesTracker.indexOf('messenger_page')!=-1){
				//	pagesTracker.splice(pagesTracker.length-pagesTracker.indexOf('messenger_page'),pagesTracker.indexOf('messenger_page'));
				//}
				app.showPage('messenger_page');


			   app.container = app.currentPageWrapper.find('.chats_wrap');
			   if(app.pageNumber == 1){
			        app.container.html('');
			   }

			   if(app.currentPageId == 'messenger_page'){

			       	$('.loadingHTML').remove();

			       	app.responseItemsNumber = app.response.chatsNumber;

     			   	if(app.responseItemsNumber == 0){
			           app.container.append('<div class="center noResults">אין הודעות</div>')
			           return;
			       	}


					app.template = $('#messengerTemplate').html();
					for(var i in app.response.allChats){
						var currentTemplate = app.template;
						var chat = app.response.allChats[i];
						currentTemplate = currentTemplate.replace("[IMAGE]",chat.user.mainImage.url);
						currentTemplate = currentTemplate.replace(/\[USERNICK\]/g,chat.user.nickName);
						currentTemplate = currentTemplate.replace("[RECENT_MESSAGE]",chat.recentMessage.text);
						currentTemplate = currentTemplate.replace("[DATE]", chat.recentMessage.date);
						currentTemplate = currentTemplate.replace("[USER_ID]", chat.user.userId);
						app.container.append(currentTemplate);
						if(chat.newMessagesCount > 0 || chat. user.isPaying == 1){
							var currentUserNode = app.container.find(":last-child");
							if(chat.newMessagesCount > 0)
								currentUserNode.find(".new_mes_count").html(chat.newMessagesCount).show();

							if(chat.user.isPaying == 1)
								currentUserNode.find(".special2").show();
						}
					}



					if(app.responseItemsNumber == app.itemsPerPage){

						var loadingHTML = '<div class="loadingHTML mar_top_8">'+$('#loadingBarTemplate').html()+'</div>';
						$(loadingHTML).insertAfter(app.container.find('.mail_section:last-child'));

						//app.startLoading();
					}

				   //else{alert(app.responseItemsNumber +' '+app.itemsPerPage)}

					app.setScrollEventHandler(1000, 2000);


			   }
			   else{
			       app.pageNumber--;
			   }

				app.stopLoading();
			}
		});
	},


	getChat: function(chatWith, userNick){
		if(chatWith==window.localStorage.getItem("userId")){app.getMyProfileData(); return;}
		app.chatWith = chatWith;
		app.startLoading();
		$.ajax({
			url: app.apiUrl+'/api/v3/user/chat/'+app.chatWith,
			success: function(response){
				app.response = response;
				console.log(JSON.stringify(app.response));
				app.showPage('chat_page');
				window.scrollTo(0, 0);
				app.container = app.currentPageWrapper.find('.chat_wrap');
				app.container.html('');
				app.template = $('#chatMessageTemplate').html();
				app.currentPageWrapper.find('.content_wrap').find("h1 span").text(userNick).attr('onclick','app.getUserProfile(\''+chatWith+'\')');
				var html = app.buildChat();
				app.container.html(html);
				app.subscribtionButtonHandler();
				app.refreshChat();
				app.stopLoading();
			}
		});
	},

	subscribtionButtonHandler: function(){
		if(app.response.chat.abilityReadingMessages == 0){
			app.container.find('.message_in .buySubscr').show().trigger('create');
		}
	},

	buildChat: function(){
		var html = '';
		var k = 1;
		var appendToMessage = '';

		for(var i in app.response.chat.items){
			var currentTemplate = app.template;
			var message = app.response.chat.items[i];


			if(from == message.from) k--;

			if(k % 2 == 0){
				messageFloat = "left";
				info = "info_left";
			}
			else{
				messageFloat = "right";
				info = "info_right";
			}

			if(app.chatWith == message.from){
				var messageType = "message_in";
				var read = "";
			}
			else{
				var messageType = "message_out";
				var read = '<div class="read_mess '+message.readClass+' '+messageFloat+'"></div>';
			}

			currentTemplate = currentTemplate.replace("[MESSAGE]", message.text);
			currentTemplate = currentTemplate.replace("[DATE]", message.date);
			currentTemplate = currentTemplate.replace("[TIME]", message.time);
			currentTemplate = currentTemplate.replace("[MESSAGE_TYPE]", messageType);
			currentTemplate = currentTemplate.replace("[MESSAGE_FLOAT]", messageFloat);
			currentTemplate = currentTemplate.replace("[INFO]", info);
			currentTemplate = currentTemplate.replace("[READ]", read);

			html = html + currentTemplate;

			var from = message.from;

			k++;
		}

		return html;
	},

	checkUserFields: function(name,val){
		if(val.length>2){
			$.ajax({
				url:app.apiUrl+'/api/v3/chekUserFields/'+name+'='+val,
				type:'Get',
				success: function(response){
				   if(response){
					app.container.find('.'+name+'State .userOk').hide();
					app.container.find('.'+name+'State .userFailed').show();

				   }else{
					app.container.find('.'+name+'State .userOk').show();
					app.container.find('.'+name+'State .userFailed').hide();
				   }
				   app.container.find('#wrong_'+name).val(response);
				}
			});
		}
	},

	sendMessage: function(){
		var message = $('#message').val();
		if(message.length > 0){
			$('#message').val('');
			$.ajax({
				url: app.apiUrl+'/api/v3/user/chat/'+app.chatWith,
				type: 'Post',
				contentType: "application/json; charset=utf-8",
				data: JSON.stringify({
					message: message
				}),
				success: function(response){
					//alert(JSON.stringify(app.response));
					app.response = response;
					var html = app.buildChat();
					app.container.html(html);
					app.subscribtionButtonHandler();
					app.refreshChat();
				}
			});

		}
	},


	refreshChat: function(){
		if(app.currentPageId == 'chat_page'){
			$.ajax({
				url: app.apiUrl+'/api/v3/user/chat/'+app.chatWith+'/refresh',
				type: 'Get',
				complete: function(response, status, jqXHR){
					//app.stopLoading();
				},
				success: function(response){
					if(response.chat != false){
						if(app.currentPageId == 'chat_page'){
							app.response = response;
							//alert(JSON.stringify(app.response));
							var html = app.buildChat();
							app.container.html(html);
							app.subscribtionButtonHandler();
						}
					}
					refresh = setTimeout(app.refreshChat, 100);

				}
			});
		}
		else{
			clearTimeout(refresh);
		}

	},

	checkNewMessages: function(){
		var user = window.localStorage.getItem("user");
      	var pass = window.localStorage.getItem("pass");

      	if(user != '' && pass != '' && app.currentPageId != 'login_page' && app.currentPageId != 'register_page' && app.currentPageId != 'recovery_page'){

			checkNewMessagesRequest = $.ajax({
				url: app.apiUrl+'/api/v3/user/newMessagesCount',
				type: 'Get',
				complete: function(response, status, jqXHR){
					//app.stopLoading();
				},
				success: function(response){
					//app.response = response;
					//alert(app.response.newMessagesCount);
					if(response.newMessagesCount > 0){
						var count = response.newMessagesCount;

						//var width = $(document).width();
						//var pos = width/2 - 30;
						$('.new_mes_count2').html(count);
						$('#main_page').addClass('pad_top_25');//css({'padding-top':'25px'});
						//$('.new_mes').show();
						if(app.logged === true && app.currentPageId != 'login_page' && app.currentPageId != 'register_page' && app.currentPageId != 'recovery_page')
							$('.new_mes').show();
						else
							$('.new_mes').hide();
						if(app.currentPageId == 'messenger_page'&&app.countMes != count){
							//$('.new_mes_count').html(count).show();
							app.getMessenger();
						}
					}
					else{
						$('.new_mes').hide();
						$('#main_page').removeClass('pad_top_25');//.css({'padding-top':'0px'});
						if(app.currentPageId == 'messenger_page'){
							$('.new_mes_count').hide();
						}
					}
					app.countMes = count;

					if(response.newNotificationsCount > 0){
						app.newNotificationsCount = response.newNotificationsCount;
						if(app.currentPageId != 'login_page' && app.currentPageId != 'register_page' && app.currentPageId != 'recovery_page'){
							$('#likesCount').html(app.newNotificationsCount).show();
						}
					}
					else{
						app.newNotificationsCount = 0;
						$('#likesCount').hide();
						//$('#likesCount').html(app.newNotificationsCount).show();
					}

					newMesssages = setTimeout(app.checkNewMessages, 10000);
				}
			});
		}
	},

	getSubscription: function(){
		var userId = window.localStorage.getItem("userId");
		var ref = window.open('http://m.kosherdate.co.il/subscription/?userId='+userId+'&app=1', '_blank', 'location=yes');

		//app.showPage('subscription_page');
		//$(".subscr_quest").unbind('click');
		//$(".subscr_quest").click(function(){
		//	$(this).siblings(".subscr_text").slideToggle("slow");
		//	var span = $(this).find("span");
		//	if(span.text() == '+')
		//		span.text('-');
		//	else
		//		span.text('+');
		//});

		//$('input[type="radio"]').removeAttr("checked");

		//$(".subscr").click(function(){
		//	$(".subscr_left").removeClass("subscr_sel");
		//	$(this).find("input").attr("checked","checked");
		//	$(this).find(".subscr_left").addClass("subscr_sel");
		//	setTimeout(function(){
		//		var product_id = $(".subscr_ch:checked").val();
		//		var nickName = '';
		//		window.location.href = 'https://www.2checkout.com/2co/buyer/purchase?sid=1400004&quantity=1&product_id='+product_id+'&userid='+app.userId+'&usernick='+nickName;
		//	},100);
		//});
	},

	confirmDeleteImage: function(imageId){
		app.imageId = imageId;
		navigator.notification.confirm(
				'מחק את התמונה הזאת?',  // message
		        app.deleteImageChoice,              // callback to invoke with index of button pressed
		        'אישור',            // title
		        'לאשר, לבטל'          // buttonLabels
		 );
	},

	deleteImageChoice: function(buttonPressedIndex){
		if(buttonPressedIndex == 1){
			app.deleteImage();
		}
	},

	deleteImage: function(){
		app.requestUrl = app.apiUrl+'/api/v3/user/images/delete/' + app.imageId,
		app.requestMethod = 'Post';
		app.getUserImages();
	},

	displayUserImages: function(){
		app.requestUrl = app.apiUrl+'/api/v3/user/images';
		app.requestMethod = 'Get';
		app.getUserImages();
	},

	getUserImages: function(){
		$('.imagesButtonsWrap').hide();
		$.ajax({
			url: app.requestUrl,
			type: app.requestMethod,
			success: function(response){

				app.response = response;
				app.showPage('delete_images_page');
				app.container = app.currentPageWrapper.find('.imagesListWrap');
				app.container.html('');
				app.template = $('#editImageTemplate').html();
				window.scrollTo(0,0);

				//alert(JSON.stringify(app.response));
				if(app.response.images.itemsNumber < 4)
					$('.imagesButtonsWrap').show();

				for(var i in app.response.images.items){
					var currentTemplate = app.template;
					var image = app.response.images.items[i];
					currentTemplate = currentTemplate.replace("[IMAGE]", image.url);
					currentTemplate = currentTemplate.replace("[IMAGE_ID]", image.id);
					app.container.append(currentTemplate);
					var currentImageNode = app.container.find('.userImageWrap:last-child');

					if(image.isValid == 1)
						currentImageNode.find('.imageStatus').html("אושר").css({"color":"green"});
					else
						currentImageNode.find('.imageStatus').html("עדיין לא אושר").css({"color":"red"});

				}

				app.container.trigger('create');
			}
		});
	},

	capturePhoto: function(sourceType, destinationType){
		// Take picture using device camera and retrieve image as base64-encoded string
		var options = {
			quality: 100,
			destinationType: app.destinationType.FILE_URI,
			sourceType: sourceType,
			encodingType: app.encodingType.JPEG,
			targetWidth: 600,
			targetHeight: 600,
			saveToPhotoAlbum: false,
			chunkedMode:true,
			correctOrientation: true
		};

		navigator.camera.getPicture(app.onPhotoDataSuccess, app.onPhotoDataFail, options);

	},

	onPhotoDataSuccess: function(imageURI) {
		app.startLoading();

		/*
		$("#myNewPhoto").attr("src","data:image/jpeg;base64," + imageURI);
		$('#myNewPhoto').Jcrop({
			onChange: showPreview,
			onSelect: showPreview,
			aspectRatio: 1
		});
		*/
		app.uploadPhoto(imageURI);
	},

	onPhotoDataFail: function() {

	},

	uploadPhoto: function(imageURI){
		var user = window.localStorage.getItem("user");
		var pass = window.localStorage.getItem("pass");
		var options = new FileUploadOptions();
        options.fileKey="file";
        options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType="image/jpeg";
        options.headers = {"Authorization": "Basic " + btoa ( user + ":" + pass)};

        var ft = new FileTransfer();
        ft.upload(
        	imageURI,
        	encodeURI("http://m.kosherdate.co.il/api/v1/user/image"),
        	app.uploadSuccess,
        	app.uploadFailure,
	        options
	    );
	},


	uploadSuccess: function(r){
		//console.log("Code = " + r.responseCode);
        //console.log("Response = " + r.response);
        //console.log("Sent = " + r.bytesSent);

		//alert(r.response);
        //return;

		app.stopLoading();

		app.response = JSON.parse(r.response);
		if(app.response.status.code == 0){
			navigator.notification.confirm(
				app.response.status.message + '. לחץי על כפתור "נהל תמונות" על מנת למחוק תמונות',  // message
		        app.manageImagesChoice,              // callback to invoke with index of button pressed
		        'Notification',            // title
		        'נהל תמונות,ביטול'          // buttonLabels
		    );
		}else if(app.response.status.code == 1){
			app.alert(app.response.status.message);
		}

		if(app.currentPageId == 'delete_images_page'){
			app.displayUserImages();
		}

	},

	manageImagesChoice: function(buttonPressedIndex){
		if(buttonPressedIndex == 1){
			app.displayUserImages();
		}
	},


	uploadFailure: function(error){
		app.stopLoading();
		app.alert("התרחשה שגיאה. נסה שנית בבקשה.");
	},



	register: function(){
		app.showPage('register_page');
		//$('#header, #beforeHead').css({"position":"absolute"});
		$('#birthDate').html(app.getBithDate()).trigger('create');


		app.getList('religions');
		app.getHeight();
		app.getList('bodyType');
		app.getList('eyesColor');
		app.getList('hairColor');
		app.getList('hairLength');
		app.getList('maritalStatus');
		app.getList('children');
		app.getList('religions');
		app.getList('smoking');
		app.getList('occupation');
		app.getList('education');
		app.getList('lookingFor', true);


		app.getRegions();
		//app.getReligions();
		$('#register_page').trigger('refresh');
	},




	getList: function(entity, multiple){

		var entityContainer = [];

		entityContainer['religions'] = '.religionList';
		entityContainer['children'] = '.childrenList';
		entityContainer['maritalStatus'] = '.maritalStatusList';
		entityContainer['bodyType'] = '.bodyTypeList';
		entityContainer['eyesColor'] = '.eyesColorList';
		entityContainer['hairColor'] = '.hairColorList';
		entityContainer['hairLength'] = '.hairLengthList';
		entityContainer['smoking'] = '.smokingList';
		entityContainer['children'] = '.childrenList';
		entityContainer['education'] = '.educationList';
		entityContainer['occupation'] = '.occupationList';
		entityContainer['lookingFor'] = '.lookingForList';





		$.ajax({
		   url: app.apiUrl+'/api/v3/list/' + entity,
			   error: function(error){
			   console.log(JSON.stringify(error));

			   },
		   success: function(list, status, xhr){
			   console.log(JSON.stringify(list));
			   var html = '';
			   if(multiple){
			   html = '<fieldset data-role="controlgroup">';
			   for(var i in list.items){
			   var item = list.items[i];
			   html = html + '<input name="' + entity + 'Id" type="checkbox" id="check-sex' + item.itemId  + '" value="' + item.itemId  + '"><label for="check-sex' + item.itemId  + '">' + item.itemName + '</label>';
			   }
			   html = html + '</fieldset>';
			   }
			   else{
			   html = '<select name="' + entity + 'Id" id="' + entity + 'Id"><option value="">בחרו</option>';
			   for(var i in list.items){
			   var item = list.items[i];
			   html = html + '<option value="' + item[0]  + '">' + item[1] + '</option>';
			   }
			   html = html + '</select>';
			   }
			   app.container.find(entityContainer[entity]).html(html).trigger("create");

			   console.log(entity + 'Id');
		   }
		});
	},



	getHeight: function(){
		var html = '';
		html = html + '<select name="userHeight" id="userHeight"><option value="">בחרו</option>';
		for (var i = 100; i <= 250; i++) {
			html = html + '<option value="' + i + '">' + i + '</option>';
		}
		html = html + '</select>';

		app.container.find('.heightList').html(html).trigger("create");
	},







	contactUs: function(){
		window.scrollTo(0, 0);
		app.showPage('contact_page');
	},


	sendMessageToAdmin: function(){

		var userId = window.localStorage.getItem("userId");
		var messageToAdmin = $('#messageToAdmin').val();

		if(!messageToAdmin.length){
			return;
		}

		app.startLoading();

		$.ajax({
		   url: app.apiUrl+'/api/v3/contactUs',
		   type: 'Post',
		   contentType: "application/json; charset=utf-8",
		   data: JSON.stringify({
				userId: userId,
				messageToAdmin: messageToAdmin,
			}),
		   error: function(error){
			   app.alert(JSON.stringify(error));
			   app.stopLoading();
		   },
		   success: function(response, status, xhr){
			   app.stopLoading();
			   $('#messageToAdmin').val('');
			   app.alert('תודה. ההודעה נשלחה');
			   app.back();
		   }
		});
	},
	
	
	getBithDate: function(){
		var html;
		//if(app.currentPageId == 'edit_profile_page')
			html = '<div class="left">'
		//else
		//	html = '<div class="right">';
		html = html + '<select name="userBirthday_d" id="d" data-iconpos="left">';
		html = html + '<option value="">יום</option>';
		for (var i = 1; i <= 31; i++) {
			html = html + '<option value="' + i + '"';
			if(app.currentPageId == 'edit_profile_page'&&i==app.response.j)
				html = html + ' selected="selected" ';			
			html = html + '>' + i + '</option>';
		}
		html = html + '</select>';		
		html = html + '</div>';
		//if(app.currentPageId == 'edit_profile_page')
			html = html + '<div class="left">'
		//else		
		//	html = html + '<div class="right">';
		html = html + '<select name="userBirthday_m" id="m" data-iconpos="left">';
		html = html + '<option value="">חודש</option>';
		for (var i = 1; i <= 12; i++) {
			html = html + '<option value="' + i + '"';
			if(app.currentPageId == 'edit_profile_page'&&i==app.response.n)
				html = html + ' selected="selected" ';			
			html = html + '>' + i + '</option>';
		}		
		html = html + '</select>';		
		html = html + '</div>';
						
		
		//if(app.currentPageId == 'edit_profile_page')
			html = html + '<div class="left">'
		//else
		//	html = html + '<div class="right">';
		html = html + '<select name="userBirthday_y" id="y" data-iconpos="left">';
		var curYear = new Date().getFullYear();
		html = html + '<option value="">שנה</option>';
		for (var i = curYear - 18; i >=1940 ; i--) {
			html = html + '<option value="' + i + '"';
			if(app.currentPageId == 'edit_profile_page'&&i==app.response.Y)
				html = html + ' selected="selected" ';			
			html = html + '>' + i + '</option>';
		}
			
		html = html + '</select>';	
		html = html + '</div>';
		return html;
	},


	getUsersForLikes: function(supposedToBeLikedUserId, notifId){

    	app.startLoading();

    	if(!supposedToBeLikedUserId){
    		supposedToBeLikedUserId = 0;
    	}

    	if(!notifId){
           	notifId = 0;
        }

        var url = app.apiUrl + '/api/v3/users/forLikes/' + supposedToBeLikedUserId + '/' + notifId;
        //alert(url);
        //return;

    	$.ajax({
           	url: url,
           	type: 'Get',
           	timeout: 10000,
           	error: function(error){
           		//alert("ERROR:" + JSON.stringify(error));
           	},
           	success: function(response){
				//alert(JSON.stringify(response));
    			if(response.userHasNoMainImage){
               		app.alert("כדי להיכנס לזירה של קשרים עליך לעדכן תמונה.");
                  	app.displayUserImages();
                }

           		//alert("RESP:" + JSON.stringify(response));
                if(response.users.itemsNumber > 0){
    				app.showPage('do_likes_page');
                   	//console.log("NUMBER: " + response.users.itemsNumber);
                   	//console.log("ITEMS: " + JSON.stringify(response));


    				var wrapper = $('.swiper-wrapper');
    				var userId = window.localStorage.getItem("userId");
    				var html = '';
    				//wrapper.html(html);
    				//alert(response.users.items.length);
    				for(var i in response.users.items){

    					if (i < 250){

    						var user = response.users.items[i];
    						//console.log("USER: " + JSON.stringify(user));
    						//html = html + '<div class="swiper-slide">'+i+'</div>';
    						html = html + '<div class="swiper-slide"><div id="' + user.id + '" class="cont" style="background-image: url('
   								+ response.users.imagesStoragePath
   								+ '/'
   								+ user.imageId
   								+ '.'
   								+ response.users.imagesExtension
    							+ ')"><div class="nickname" onclick="app.getUserProfile(' + user.id + ')">' + user.nickName + ', '+ user.age +'</div></div></div>';

   							//if (i < 3){
   								//wrapper.append(html);
   								//html = '';
   							//}
    						//wrapper.append(html);
   						}
   						if (i == 250) break;
   					}
                    wrapper.html(html);
                    //wrapper.append(html);
                    //console.log("SWIPER HTML: " + wrapper.html());
    				app.initSwiper();
    				app.showPage('do_likes_page');
                }
            }
        });
    },


    initSwiper: function(){

    	if(app.swiper != null){
    		app.swiper.destroy();
    	}

    	app.swiper = new Swiper ('.swiper-container', {
           	// Optional parameters
            direction: 'horizontal',
            //initialSlide:10,
            //spaceBetween: 50,
            loop: true,
            speed: 100,
            nextButton: '.unlike.icon'

            // If we need pagination
            //pagination: '.swiper-pagination',

            // Navigation arrows
            //nextButton: '.swiper-button-next',
            //prevButton: '.swiper-button-prev',

            // And if we need scrollbar
            //scrollbar: '.swiper-scrollbar',
        });
    },


    doLike: function(){

    	var userId = $('.swiper-slide-active .cont').attr("id");

    	$.ajax({
           	url: app.apiUrl + '/api/v3/user/like/' + userId,
           	type: 'Post',
           	error: function(error){
           		console.log("ERROR: " + JSON.stringify(error));
           	},
           	success: function(response){
           		//console.log("SUCCESS: " + JSON.stringify(response));
           		app.swiper.slideNext();
           		$('#' + userId).parents('.swiper-slide').remove();
           		app.checkBingo();
           	}
        });
    },


    test: function(){

    },


    getChatWith: function(){
    	var chatWith = $('.swiper-slide-active .cont').attr("id");
    	var userNick = $('.swiper-slide-active .cont .nickname').text();
    	console.log($('.swiper-container').html());
    	app.getChat(chatWith, userNick);
    },


    getLikesNotifications: function(){

    	app.startLoading();
   		$.ajax({
           	url: app.apiUrl + '/api/v3/user/likes/notifications',
           	type: 'Get',
           	error: function(error){
           		console.log("ERROR: " + JSON.stringify(error));
           	},
           	success: function(response){
           		//console.log("SUCCESS: " + JSON.stringify(response));
           		app.showPage('likes_notifications_page');

           		if(response.likesNotifications.itemsNumber > 0){
           		    var template = $('#likeNotificationTemplate').html();
           		  	var html = '';

           		    for(var i in response.likesNotifications.items){
           		    	var currentTemplate = template;
   						var notification = response.likesNotifications.items[i];

   						notification.nickName = notification.nickName.replace(/'/g, "׳");

   						imageUrl = response.likesNotifications.imagesStoragePath
   							+ '/'
                            + notification.imageId
                            + '.'
                            + response.likesNotifications.imagesExtension
                        ;

                        var isReadClass = (notification.isRead == 1) ? 'isRead' : '';
                        var bingoClass = (notification.bingo == 1) ? 'bingo' : '';
                        var func = (notification.bingo == 1)
                          	? "app.setUserNotificationAsRead(" + notification.id + ", this);app.getChat('" +  notification.userId  + "','" + notification.nickName + "');"
                           	: "app.getUsersForLikes('" + notification.userId  + "','" + notification.id  + "')"
                        ;

   						currentTemplate = currentTemplate.replace("[IMAGE]", imageUrl);
                       	currentTemplate = currentTemplate.replace(/\[USERNICK\]/g,notification.nickName);
                       	currentTemplate = currentTemplate.replace("[FUNCTION]", func);
                       	currentTemplate = currentTemplate.replace("[TEXT]",notification.template.replace("[USERNICK]", notification.nickName));
                       	currentTemplate = currentTemplate.replace("[DATE]", notification.date);
                       	currentTemplate = currentTemplate.replace("[USER_ID]", notification.userId);
                       	currentTemplate = currentTemplate.replace("[IS_READ_CLASS]", isReadClass);
                       	currentTemplate = currentTemplate.replace("[BINGO_CLASS]", bingoClass);

   						html = html + currentTemplate;
   					}

   					console.log("HTML: " + html);

   					app.currentPageWrapper.find('.notifications_wrap').html(html);
   				}
           	}
        });
   	},


   	checkBingo: function(){

   		if(app.currentPageId != 'login_page' && app.currentPageId != 'register_page' && app.currentPageId != 'recovery_page'){

   			if(checkBingo != ''){
   				checkBingo.abort();
   			}

   			checkBingo = $.ajax({
   				url: app.apiUrl + '/api/v3/user/bingo',
   				type: 'Get',
   				error: function(error){
   					console.log("ERROR: " + JSON.stringify(error));
   				},
   				success: function(response){
   					if(app.currentPageId != 'login_page' && app.currentPageId != 'register_page' && app.currentPageId != 'recovery_page'){
   						console.log("SUCCESS: " + JSON.stringify(response));
   						if(response.bingo.itemsNumber > 0){
   							for(var i = 0; i < response.bingo.itemsNumber; i++){
   								var bingo = response.bingo.items[i];

   								if(!app.inBingosArray(bingo)){
   									app.bingos.push(bingo);
   								}
   							}

   							if(!app.bingoIsActive && app.currentPageId != 'chat_page'){
   								app.splashBingo(response);
   							}

   						}

   						setTimeout(app.checkBingo, 10000);
   					}
   				}
   			});
        }
    },


    splashBingo: function(response){
    	//alert(app.bingos.length);
    	for(var i in app.bingos){
    		if(typeof(app.bingos[i]) !== "undefined" ){
    			//alert("Bingo " + i + ": " + JSON.stringify(app.bingos[i]));
    			var bingo = app.bingos[i];
    			var template = $('#bingoTemplate').html();

    			userImageUrlTemplate = response.bingo.imagesStoragePath
                   	+ '/'
                    + '[IMAGE_ID]'
                    + '.'
                    + response.bingo.imagesExtension
                ;

                var userImageUrl_1 = userImageUrlTemplate.replace('[IMAGE_ID]', bingo.userImageId_1);
                var userImageUrl_2 = userImageUrlTemplate.replace('[IMAGE_ID]', bingo.userImageId_2);

    			template = template.replace("[USER_IMAGE_URL_1]", userImageUrl_1);
    			template = template.replace("[USER_IMAGE_URL_2]", userImageUrl_2);
    			template = template.replace("[USER_ID]", bingo.userId);
    			template = template.replace(/\[USERNICK\]/g, bingo.nickName);

    			$('#bingo_page').css({"background":"url('" + userImageUrl_2 + "') no-repeat center center", "background-size":"cover"}).html(template);
    			app.showPage('bingo_page');

    			app.bingoIsActive = true;
    			app.setBingoAsSplashed(bingo, i);
    			break;
    		}
        }
    },


    setBingoAsSplashed: function(bingo, i){

    	var data = JSON.stringify(bingo);

    	$.ajax({
           	url: app.apiUrl + '/api/v3/user/bingo/splashed',
           	type: 'Post',
           	data: data,
           	error: function(error){
           		console.log("ERROR: " + JSON.stringify(error));
           	},
           	success: function(response){
           		console.log(JSON.stringify(response));
           		if(response.success){
           			app.bingos.splice(i, 1);
           		}
           	}
        });
    },


    inBingosArray: function(bingo){
    	for(var i in app.bingos){
    		if(app.bingos[i].id === bingo.id){
    			return true;
    		}
    	}

    	return false;
    },


    setUserNotificationAsRead: function(notifId, clickedObj){

    	$.ajax({
           	url: app.apiUrl + '/api/v3/user/notification/' + notifId + '/read',
           	type: 'Post',
           	error: function(error){
           		console.log("ERROR: " + JSON.stringify(error));
           	},
           	success: function(response){
           		console.log(JSON.stringify(response));
           		$(clickedObj).addClass("isRead");
           	}
        });
    },

		
	dump: function(obj) {
	    var out = '';
	    for (var i in obj) {
	        out += i + ": " + obj[i] + "\n";
	    }
	    app.alert(out);
	}	
	
		
};


document.addEventListener("deviceready", app.init, false);

window.addEventListener('load', function() {
	new FastClick(document.body);
}, false);


function showPreview(coords)
{
	var rx = 100 / coords.w;
	var ry = 100 / coords.h;

	$('#preview').css({
		width: Math.round(rx * 500) + 'px',
		height: Math.round(ry * 370) + 'px',
		marginLeft: '-' + Math.round(rx * coords.x) + 'px',
		marginTop: '-' + Math.round(ry * coords.y) + 'px'
	});
}


$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};



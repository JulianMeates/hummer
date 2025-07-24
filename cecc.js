// Document Ready
jQuery(document).ready(function($){	
	
	$('input#SearchForm_SearchForm_Search').val('Enter keyword');
	
	// Form Input Fields Clear
	$.fn.ToggleInputValue = function(){
		return $(this).each(function(){
			var Input = $(this);
			var default_value = Input.val();

			Input.focus(function(){
			   if(Input.val() == default_value) Input.val("");
			}).blur(function(){
				if(Input.val().length == 0) Input.val(default_value);
			});
		});
	}
	$('input#SearchForm_SearchForm_Search, input#Form_EventSearch_Title, input#Form_ResourceSearch_Title, .newsletter input.text').ToggleInputValue();
	
	
	$(function(){
		if($('a.iframe').length > 0){
			$('a.iframe').fancybox({
				overlayColor: '#000',
				padding: 10,
				type: 'iframe',
				titlePosition: 'inside'
			});
		}
		if($('a.map').length > 0){
			$('a.map').fancybox({
				overlayColor: '#000',
				type: 'inline',
				padding: 10,
				titlePosition: 'inside',
				onComplete: initialize 
			});
		}
	});
	
	//E Newsletter stuff
	$('.newsletter input.text').blur(function(){
		var email = $(this).val();
		var formUrl = $('.newsletter').attr('action');
		var test = formUrl+'email/'+email;
		$('.newsletter').attr('action', formUrl+'email/'+email);
	});
	
	
	var pageUrl = $(location).attr('href');
	
	if (pageUrl.indexOf("email") >= 0) {
		var email = pageUrl.substr(pageUrl.indexOf("/email/") + 7)
		$("input.email").val(email);
	}
	
	
});
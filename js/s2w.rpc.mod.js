if(s2w == null) var s2w = {};
s2w.rpc = {
	_id: 'rpc_0',
	_jsonrpc: '2.0',
	_cache: false,//true to allow caching
	/**
	 * called if (readystate == 4 && status == 200)
	 * @param object R Response object. R.result contains the result
	 */
	onSuccess: function(result){s2w.log.error(this,'default onSuccess, nothing to do.')},
	/**
	 * called if (readystate == 4 && status != 200)
	 */
	onError: function(){s2w.log.error(this,'default onError, nothing to do.')},
	onUnOpened: function(){},//readyState == 0
	onOpened: function(){},//readyState == 1
	onSend: function(){},//readyState == 2
	onLoading: function(){},//readyState == 3. Not recommended to use responseText
	/**
	 * called at the end of readystate == 4. After onError || onSuccess
	 */
	onComplete: function(){},//readyState == 4,
	_wait: false
}
s2w.rpc._factories = [
	function() {return new XMLHttpRequest();},
	function() {return new ActiveXObject("Msxml2.XMLHTTP");},
	function() {return new ActiveXObject("Microsoft.XMLHTTP");}	
]

s2w.rpc._factory = null;

s2w.rpc.newRequest = function(){
	if(s2w.rpc._factory != null) return HTTP._factory;
	
	for(var i = 0; i<s2w.rpc._factories.length; i++){
		try{
			var factory = s2w.rpc._factories[i];
			var request = factory();
			if(request != null){
				s2w.rpc._factory = factory;
				return request;
			}
		}catch(e){continue;}
	}

	s2w.rpc._factory = function(){
		s2w.error.trigger("XMLHttpRequest not supported. Ajax is not available.");
	}
	s2w.rpc._factory();
}
s2w.rpc.request = new s2w.rpc.newRequest();
s2w.rpc.request.onreadystatechange = function(){
	if(this.readyState == 0) s2w.rpc.onUnOpened();
	if(this.readyState == 1) s2w.rpc.onOpened();
	if(this.readyState == 2) s2w.rpc.onSend();
	if(this.readyState == 3) s2w.rpc.onLoading();
	if(this.readyState == 4){ 
		if(this.status == 200){s2w.log.debug(this,'rpc response ok. received '+this.responseText);
			if(this.responseText){
				s2w.rpc._handleResponse(this.responseText);	
				s2w.rpc.onComplete();
				return true;
			}else
				s2w.log.error(this,s2w.rpc.url+' empty response');
			
		}else if(this.status == 404){
			s2w.rpc.onError(s2w.rpc.url+' not found');
			s2w.log.error(this,s2w.rpc.url+' not found');
		}else
			s2w.log.error(this,'response received, but unknown error');
			
		s2w.rpc.onError('error desconocido al conectar a '+s2w.rpc.url);
		s2w.rpc.onComplete();
	}
}
s2w.rpc._handleResponse = function(text){
	/**
	 * Creates the RPCPHP Response Object 2.0
	 * with properties [_id, _jsonrpc, result, error]. Where
	 * result = (array | null)
	 * 
	 */
	Response = eval('('+text+')');
	
	if(Response.result != null){
		s2w.rpc.onSuccess(Response.result);
		return true;
		
	}else if(Response.error != null){
		s2w.rpc.onError(Response.error.message);
		suberror = Response.error;
		do{
			s2w.log.error(this, s2w.rpc.url+' error: '+suberror.message);
			suberror = suberror.data;
		}while(suberror != null );
	}
}
s2w.rpc._setHeaders = function(){
	if(this._cache) return;
	s2w.rpc.request.setRequestHeader("Pragma", "no-cache");
	s2w.rpc.request.setRequestHeader("Cache-Control", "no-store, no-cache, must-revalidate, post-check=0, pre-check=0");
	s2w.rpc.request.setRequestHeader("Expires", 0);
	s2w.rpc.request.setRequestHeader("Last-Modified", new Date(0));
	s2w.rpc.request.setRequestHeader("If-Modified-Since", new Date(0));
}
/**
 * Function to make AJAJ expansible for any GET request. For specific
 * JSONRPC-PHP Request, use the post method
 */
s2w.rpc.get = function(url){s2w.log.debug(this, 'executing rpc to '+url);
	if(url == null){ 
		s2w.log.error(this,'url not defined. Get aborted');
		return false;
	}
	
	s2w.rpc.request.open("GET", url, false);
	
	s2w.rpc._setHeaders();
	
	s2w.rpc.request.send(null);
	return true;
}
/**
 * Function to create the JSONRPC-PHP Request Object, version 2.0
 */
s2w.rpc._getRequest = function(method, params){
	a = {
			"id": s2w.rpc._id,
			"jsonrpc": s2w.rpc._jsonrpc,
			"method": method,
			"params": params
		};

	return a;
}

/**
 * Function to make AJAJ Request, with POST method.
 * 
 * @param {String} url
 * @param {String} method Name of method to be executed in server
 * @param {Array} params Parameters expected by method 
 */
s2w.rpc.post = function(url, method, params){s2w.log.debug(this, 'executing rpc to '+url);
	url = url || s2w.rpc.url;
	s2w.rpc.url = url;
	if(url == null || url == "undefined" || method == null || params == null){ 
		s2w.log.error(this,'usage: post(url, method, params). All arguments required.');
		return false;
	}
	
	s2w.rpc.request.open("POST", url, false);
	
	s2w.rpc._setHeaders();
	s2w.rpc.request.setRequestHeader("Accept", "application/json");
	s2w.rpc.request.setRequestHeader("Content-type", "application/json");
	o = s2w.rpc._getRequest(method, params);
	s2w.rpc.request.send(JSON.stringify(o));
}

s2w.rpc.dbQuery = function(query){
	if(/^select/i.test(query))
		method = "\\s2w\\db\\query2array";
	else if(/^(select|create|insert|update|drop)/i.test(query))
		method = "\\s2w\\db\\query";
	else{
		s2w.log.error(this,'unsopported query '+query+'. Nothing to do');
		return false;
	}
	
	s2w.rpc.post(s2w.rpc.url, method,query);
	
	return true;
}


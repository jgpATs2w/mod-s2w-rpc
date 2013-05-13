<?
namespace s2w\rpc;
/*
Based on:

Copyright 2007 Sergio Vaccaro <sergio@inservibile.org>
/**
 * This class build a json-RPC Server 2.0
 * http://json-rpc.org/wiki/specification
 *
 * @author sergio <jsonrpcphp@inservibile.org>
 * @modified by Javier Garcia <jgp@sens2web.es>
 */

/**
 * This function handle a request binding it to a given object
 *
 * @param string $namespace
 * @return boolean true if finished, false if request is not json-post
 */
function handlePost() {
	if ( $_SERVER['REQUEST_METHOD'] != 'POST' || empty($_SERVER['CONTENT_TYPE']) 
		|| strpos($_SERVER['CONTENT_TYPE'],'application/json') === false)//modified to accept encoding in content-type header
		return false;

	$request = @json_decode(file_get_contents('php://input'),true);
	
	_handleRequest($request);
	
	return true;
}
function _handleRequest($request){
	
	$response = new RPCResponse($request);
	
	try {
		$Method = _decodeNameSpace($request['method']);
		
		\s2w\basic\load_modules(array($Method['module']));
		
		if(function_exists($Method['full'])){
			$method_return = $Method['full']($request['params'], $response);
			
			if ($method_return){
				$response->setResult($method_return);
			}else
				$response->pushError(RPCErrorCode::SERVER_ERROR,$Method['full'].'('.$request['params'].') returned null');
		}else 
			$response->pushError(RPCErrorCode::METHOD_NOT_FOUND,$Method['full'].' unknown');
		
	} catch (Exception $e) {
		$response->pushError(RPCErrorCode::INTERNAL_ERROR,$e->getMessage());
	}

	
	$response->send();
}
/**
 * @param {string} $method fully cualified name for method. I.e. s2w\db\query
 * @return {array} keys=['method','module','full']
 */
function _decodeNameSpace($method){
	$M = explode('\\', $method);
	$R = array();
	$R["module"] = $M[2];
	$R["method"] = $M[3];
	$R["full"] = $method;
	
	return $R;
}
class RPCResponse {
	private $_id = null;
	private $_jsonrpc = '2.0';
	private $_result = null;
	private $_error = null;
	private $_notification = true;
	
	function __construct($request){
		if(!empty($request['id'])){
			$this->_id = $request['id'];
			$this->_notification = false;
		}
	}
	function setResult($result){$this->_result = $result;}
	/**
	 * @param {integer} code one of the codes defined in RPCErrorCode
	 * @param {string} message client description of the error
	 */
	function pushError($code, $message){
		if($this->_error == null) $this->_error = new RPCError($code,$message);
		else $this->_error->data = new RPCError($code,$message);
	}
	function send(){
		if($this->_id == null) return;
		header('content-type: text/javascript');
		
		echo @json_encode(array(
								'id'=>$this->_id,
								'jsonrpc'=>$this->_jsonrpc,
								'result'=>$this->_result,
								'error' =>$this->_error
								)
						);
	}
}
class RPCError{
	public $code=null;
	public $message;
	public $data;
	
	function __construct($code,$message){
		$this->code = $code;
		$this->message = $message;
	}
}
class RPCErrorCode{
	const PARSE_ERROR = -32700;
	const INVALID_REQUEST = -32600;
	const METHOD_NOT_FOUND = -32601;
	const INVALID_PARAMS = -32602;
	const INTERNAL_ERROR = -32603;
	const SERVER_ERROR = -32000;
	const SERVER_ERROR_SQL = -32001;
	const DB_NOT_CONNECTED = -32002;
}
?>
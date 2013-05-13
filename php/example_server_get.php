<?
/**
 * Simple and flexible way to use AJAJ
 */
if($_GET){
	echo json_encode(array(
						'id'=>'rpc_0',
						'jsonrpc' => '2.0',
						'result' => $_GET,
						'error' => NULL
					)
				);
}
?>
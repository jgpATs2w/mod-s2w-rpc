<?php
namespace s2w;
require_once '../../basic/php/s2w.basic.mod.php';?>


<h1>Testing RPC Server module</h1>
This script is implemented to debug the rpc module with server output directly<br>
<?
$request = array("id"=>"testing","method"=>"\\s2w\\db\\query","params"=>"create table rpc6 inherits rpc;");

rpc\_handleRequest($request);

/* try nested errors
$response = new \s2w\rpc\RPCResponse($request);
$response->pushError(1234, 'primero');
$response->pushError(5678, 'segundo');

$response->send();*/

?>
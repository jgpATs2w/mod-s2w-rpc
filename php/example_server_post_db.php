<? 
namespace s2w;
require_once '../../basic/php/s2w.basic.mod.php';
basic\load_modules(array('db', 'rpc'));

\s2w\rpc\handlePost();
?>
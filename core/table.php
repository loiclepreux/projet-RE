<?php 

namespace monApp\core;

class table{

    public function __get($key) {
        $method = 'get' . ucfirst($key);
        $this->$key = $this->$method();
        return $this->$key;
    }

    public static function tous(){
        $class = get_called_class();
        if(strripos($class,"\\")){
            $table = substr($class,strripos($class,"\\")+1);
        }else{
            $table = $class;
        }
        return app::$db->query("select * from $table","$class");
    }

    public static function specifique($conditions){
        $class = get_called_class();
        if(strripos($class,"\\")){
            $table = substr($class,strripos($class,"\\")+1);
        }else{
            $table = $class;
        }
        $data=[];
        $sql = "select * from $table where";
        foreach($conditions as $key=>$condi){
            $champs = $condi["champs"];
            $champs_key = ":".$condi["champs"]."_".$key;
            $op = $condi["op"];
            $valeur = $condi["valeur"];
            if($valeur=="NULL"){$valeur=null;}
            $connect = isset($condi["connect"]) ? $condi["connect"]:"";
            $sql .= " $champs $op $champs_key $connect";
            $data[$champs_key] = $valeur;
        }
        return app::$db->prepare($sql,$data,$class);
    }

    public static function onlyOne($conditions){
        $class = get_called_class();
        return$class::specifique($conditions)[0];
    }
    
    public static function byId($id){
        $class = get_called_class();
        $conditions = [
            [
                "champs"=> $class::$key,
                "op"=> "=",
                "valeur"=> $id,
            ]
        ];
        return $class::onlyOne($conditions);
    }

    public static function activObj($obj){
        if(app::$activeObj==""){
            app::$activeObj = $obj;
        };
    }

    public static function find($id) {
        $class = get_called_class();
        return static::byId($id);
    }

    public function ajout() {
        $sql = "INSERT INTO " . static::getTable() . " SET ";
        $fields = [];
        
        foreach(get_object_vars($this) as $key => $value) {
            if($value !== null && $key !== 'id') {
                $fields[] = "$key = :$key";
            }
        }
        
        $sql .= implode(', ', $fields);
        
        $stmt = app::getDb()->prepare($sql);
        
        foreach(get_object_vars($this) as $key => $value) {
            if($value !== null && $key !== 'id') {
                $stmt->bindValue(":$key", $value);
            }
        }
        
        $stmt->execute();
        return app::getDb()->lastInsertId();
    }

    public function save() {
        $data = [];
        $class = new \ReflectionClass($this);
        $properties = $class->getProperties(\ReflectionProperty::IS_PROTECTED);
        
        foreach ($properties as $property) {
            $propertyName = $property->getName();
            if ($propertyName !== static::$key && isset($this->$propertyName)) {
                $data[$propertyName] = $this->$propertyName;
            }
        }

        if (isset($this->{static::$key})) {
            // Update
            $sql = "UPDATE " . static::getTable() . " SET ";
            foreach ($data as $key => $value) {
                $sql .= "$key = :$key, ";
            }
            $sql = rtrim($sql, ', ');
            $sql .= " WHERE " . static::$key . " = :" . static::$key;
            $data[static::$key] = $this->{static::$key};
            
            app::$db->prepare($sql, $data, get_class($this));
            return $this->{static::$key};
        } else {
            // Insert
            $columns = implode(',', array_keys($data));
            $values = ':' . implode(',:', array_keys($data));
            $sql = "INSERT INTO " . static::getTable() . " ($columns) VALUES ($values)";
            
            app::$db->prepare($sql, $data, get_class($this));
            return app::$db->lastInsertId();
        }
    }

    public function delete() {
        if (!isset($this->{static::$key})) {
            return false;
        }
        
        $sql = "DELETE FROM " . static::getTable() . " WHERE " . static::$key . " = :" . static::$key;
        $data = [static::$key => $this->{static::$key}];
        
        return app::$db->prepare($sql, $data, get_class($this));
    }
}

?>
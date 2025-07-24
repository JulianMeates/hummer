	/* The Class Class has the following properties:
	ClassName(): String - Returns the name of the class
	IsArray(): Boolean - Returns whether the class is an array class or not (by default they are not unless isArrayOf(memberType) has been called)
	SuperClass(): Class - Returns a reference to the superclass
	 
	isArrayOf(memberType: Class) - Makes the class into an array class (can only be called once), with members of the supplied type.
						Methods are added to the class and it now conforms to the interface TypedArrayClass.
	setProperties(properties: Object) - Gives the class new properties (can only be called once).
						The Class' properties will take on the names of the properties of the parameter.
						The Class' properties will take on the types of the values of the properties of the parameter.
						eg {name:String,age:Number,dob:Date,children:PersonArray}
						Methods are added to the class and it now conforms to the interface TypedPropertyClass.
	
	Instances of the Class Class have the following properties:
	ClassName(): String - Returns the name of the class
	IsArray(): Boolean - Returns whether the class is an array class or not (by default they are not unless isArrayOf(memberType) has been called)
	SuperClass(): Class - Returns a reference to the superclass
	*/
	
	/* The TypedArrayClass Interface supplies the additional functions:
	MemberType(): Class - Returns the member type of the array
	CONSTRUCTOR(valueArray : Array of MemberType) - optionally invokes the function Array(valueArray) below if parameter is supplied
	 
	Instances of the TypedArrayClass Interface have the following additional functions:
	MemberType(): Class - Returns the member type of the array
	Array(valueArray: Array of MemberType) - replaces the array with the values passed, after type-checking them.
	Array():Array - returns a copy of the private internal type-checked array object
	Add(value : MemberType) - adds a value to the array. If the value is not of memberType an exception is thrown. 
	*/
	 
	/* The TypedPropertyClass Interface supplies the additional functions:
	Properties(): Object - Returns the Properties passed to setProperties when class was defined.
	CONSTRUCTOR(values : Object) - optionally invokes the function SetProperties(values) below if parameter is supplied
	
	Instances of the TypedPropertyClass Interface have the following additional functions:
	Properties(): Object - Returns the Properties passed to setProperties when class was defined.
	SetProperties(values: Object) - Sets the values of any number of properties after type-checking.
						eg {name:"Andrew",age:21,children:myChildrenArray}
	Instances of the typed property class will also contain methods of the names supplied to the setProperties call:
	eg.
	name(value : String) - Each method acts as a getter/setter.
	name(): String		- If called without parameters it gets the value
	age(value : Number)  - If called with parameters it sets the value
	age(): Number
	children(value : PersonArray)
	children():PersonArray
	*/
	
	/* Examples:
	var Animal = Jade.Class.New("Animal"); // define the class		
	Animal.setProperties({color:String,age:Number}); // give it properties

	var myAnimal = new Animal({color:"blue",age:14}); // instantiate it
	myAnimal.age(); // get a property - returns 14
	myAnimal.color("red"); // change a property
	myAnimal.color(); // now returns "red"
	myAnimal.age(Animal); // throws exception - fails type-check
	
	var Lion = Jade.Class.New("Lion",Animal); // subclass animal
	Lion.setProperties({kills:Number}); // add subclassed properties
	
	var myLion = new Lion({kills:12,color:"yellow"}); // instantiate it. Can set properties defined in superclass
	myLion.kills(45); // set the kills
	myLion.color(); // returns "yellow"
	myLion.Classname(); // returns "Lion"
	myLion instanceof Lion; // returns true
	myLion instanceof Animal; // returns true - a subclass is an instance of its superclass
	myLion.Superclass(); // returns Animal
	myLion.Properties(); // returns {kills:Number, color:String, age:Number}
	
	// Here's an array:
	var AnimalArray = Jade.Class.New("AnimalArray");
	AnimalArray.isArrayOf(Animal); // make it into an array

	var myAA = new AnimalArray([myAnimal,myLion]); // instantiate it. Can set initial contents.
	myAA.Array(); // returns [myAnimal,myLion]
	myAA.Array([]); // sets the array to empty
	myAA.Add(myAnimal); // adds to the array
	
	var LionArray = Jade.Class.New("LionArray",AnimalArray); // subclasses animalarray
	LionArray.isArrayOf(Lion); // make it into an array

	var myLA = new LionArray([myLion]); // instantiate it
	myLA.Add(myAnimal); // will throw type-check exception.
	*/
	
	/*global Jade*/
	if (!Jade) {
		var Jade = {};
	}
	Jade.Class = function(){
	
		/* This returns true if the value passed conforms to the provided type		 
		 value: Any (required), a value to type-check
		 type: Class (required), the type that value must conform to
		 Returns: Boolean, true if the value conforms to the type
		 */
		function typeCheck(value, type){ // check that the first parameter validly conforms to the type of the second parameter
			if ('function' === typeof type && value instanceof type) {return true;} // includes superclasses
			var toi = typeof value; // save the type of instance to speed things up
			if (toi === 'undefined' || value === null) {return true;} // null matches everything
			// Check for Javascript primitive types
			if (type === String 	&& toi === 'string') {return true;}
			if (type === Boolean	&& toi === 'boolean') {return true;}
			if (type === Number 	&& toi === 'number') {return true;}
			// Check for Soap primitive types
			if (type === 'string'	&& (toi === 'string' || value instanceof String)) {return true;}
			if (type === 'boolean'	&& (toi === 'boolean' || value instanceof Boolean)) {return true;}
			if (type === 'decimal'	&& (toi === 'number' || value instanceof Number)) {return true;}
			if (type === 'int'	&& (toi === 'number' || value instanceof Number)) {return true;}
			if (type === 'float'	&& (toi === 'string' || value instanceof String)) {return true;}
			if (type === 'double'	&& (toi === 'number' || value instanceof Number)) {return true;}			
			if (type === 'dateTime'	&& value instanceof Date) {return true;}
			if (type === 'time'	&& value instanceof Date) {return true;}
			if (type === 'date'	&& value instanceof Date) {return true;}
			if (type === 'base64Binary'	&& (toi === 'string' || value instanceof String)) {return true;}
			if (type === 'unsignedByte' && (toi === 'string' || toi === 'number' || value instanceof String || value instanceof Number)) {return true;}
			if (type === 'byte' && (toi === 'string' || toi === 'number' || value instanceof String || value instanceof Number)) {return true;}
			if (type === 'long' && (toi === 'number' || value instanceof Number)) {return true;}	
			return false;
		}
		/* Creates a Class instance and returns it
		 classname: String (required), the name of the class
		 superclass: Class (optional), the class to inherit from
		 Returns: Class
		 */
		function defineClass(classname,superclass){
			var nc;
			function NewClass(arg){ // create the defineClass
				if (!(this instanceof arguments.callee)) {throw 'Constructor must be called using \'new\'';}
				if ('undefined' === typeof arg){return;}
				if ('function' === typeof this.Array){
					this.Array(arg);
				} else if ('function' === typeof this.SetProperties){
					this.SetProperties(arg);
				}
			}
			nc = NewClass;
			// perform the subclassing - make it inherit
			if ('function' === typeof superclass) {
				var Inheritance = function (){};
				Inheritance.prototype = superclass.prototype;
				nc.prototype = new Inheritance();
				nc.prototype.constructor = nc;
			}
			// record the superclass and the classname on both the class itself and its instances
			function GetSuperclass(){
				return superclass;
			}
			nc.prototype.Superclass = nc.Superclass = GetSuperclass;
			function GetClassname(){
				return classname;
			}
			nc.prototype.Classname = nc.Classname = GetClassname;
			/* This makes a class be an array class*/
			function isArrayOf(memberType){
				if ('function' !== typeof this) {throw 'Function must be applied to a class created by the \'defineClass\' function.';}
				if ('function' !== typeof memberType && 'String' !== typeof memberType) {throw 'MemberType parameter must be a valid constructor function or name of SOAP primitive type.';}
				var privateValue = [];
				function SetGetArray(valuearray){
					if ('undefined' !== typeof valuearray) {
						if (!(valuearray instanceof Array)){throw 'The valuearray parameter must be an array';}
						// Perform type checks
						for (var i = 0; i < valuearray.length;i++){
							if (!typeCheck(valuearray[i],memberType)){throw 'The valuearray parameter contains an object which cannot be added to this array.';}
						}
						// if all types match the set it					
						privateValue = valuearray.slice();
					} else {
						return privateValue.slice(); // make an independent copy and return it	
					}
				}
				this.prototype.Array = SetGetArray;
				function Add(value){
					if (!typeCheck(value,memberType)){throw 'An object of that type cannot be added to this array.';}
					privateValue.push(value);
				}
				this.prototype.Add = Add;
	
				function GetMemberType(){return memberType;}
				this.prototype.MemberType = this.MemberType = GetMemberType;
				function IsArray(){return true;}
				this.prototype.IsArray = this.IsArray = IsArray;
			}
			nc.isArrayOf = isArrayOf;			
			/* This adds extra type-checking functionality to a class */
			function setProperties(properties){
				if ('function' !== typeof this) {throw 'Function must be applied to a class created by the \'defineClass\' function.';}
				var superclass = this.Superclass();
				var p; // p will be used in loops (each p in properties)
				var allProperties = {}; // all properties passed in plus all superclass properties
				// inherit properties from superclass
				if ('function' === typeof superclass) {
					var sp = superclass.Properties();
					for (p in sp) {
						allProperties[p] = sp[p];
					}
				}
				// add properties from parameter
				for (p in properties){
					if ('function' !== typeof properties[p] && 'string' !== typeof properties[p]){
						throw 'Properties parameter must be passed constructor functions or the name of a SOAP primitive type. The value of \'' + properties[p] + '\' is not one of these.';
					}
					allProperties[p] = properties[p]; // copy the passed properties into the collection
				}
				function GetProperties(){
					var propcopy = {}; // return a copy, so there is no access to private objects
					for (p in allProperties){
						propcopy[p] = allProperties[p];
					}
					return propcopy;
				}
				this.prototype.Properties = this.Properties = GetProperties;
				/* parameter values should be JSON value pairs to initialize, eg:
				 * {kills:17,color:'blue'}
				 * Or, equally, an object with those properties set */
				function SetProperties(values){ //constructor, it can take property values as parameters
					for (p in values) {
						if ('undefined' === typeof allProperties[p]) {
							throw 'Property \'' + p + '\' is not defined on class \'' + this.Classname() + '\' and so cannot be set in constructor.';
						}
						this[p](values[p]); // call setter to set value
					}
				}
				this.prototype.SetProperties = SetProperties;
				// For each of the propeties defined, create a method that checks them
				// we don't need to loop up the hierarchy here since methods will be inherited automatically
				function createGetSetFunction(prop){ // this extra wrapper locks in p/prop within the inner function
					var privateValue = null; // this variable stores the value that the function gets/sets
					function GetSetFunction(value){
						if ('undefined' === typeof value) { // if method is called with no parameters then it acts as a getter
							return privateValue;
						}
						if (!typeCheck(value, properties[prop])) {throw 'Invalid type assignment. Attribute \'' + prop + '\' cannot be assigned value \'' + value + '\'.';}
						privateValue = value;
					}
					return GetSetFunction;
				}
				for (p in properties){
				    this.prototype[p] = createGetSetFunction(p);
				}
			}
			nc.setProperties = setProperties;
			function NotArray(){return false;}
			nc.prototype.IsArray = nc.IsArray = NotArray;
			return nc;
		}
		// public methods
		return {			
			New : defineClass
		}
	}();
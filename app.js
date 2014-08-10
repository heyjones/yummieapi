var express = require('express');
var app = express();
var http = require('http');
var shopifyAPI = require('shopify-node-api');
var soap = require('soap');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('OUkg9XvLhLHqv9M51lOrAA');

app.get('/', function(req, res){
	res.send('yummieapi');
});

app.get('/shopify/orders.json', function(req, res){
	var Shopify = new shopifyAPI({
		shop: 'seedcms.myshopify.com',
		shopify_api_key: '89fa1ac4b082c6877427bd553b4f64a1',
		shopify_shared_secret: 'efced55c08389299d01b9fba89e6f303',
		access_token: 'f4eaa7a2a3da1a3c6d5d808b3737d0b1',
		verbose: false
	});
	Shopify.get('/admin/orders.json', {status: 'open'}, function(err, data, headers){
		res.send(data.orders);
	});
});

app.get('/yummie/styles.json', function(req, res){
	var styles = [];
	soap.createClient('http://dev8.nicheweb.com.au/feed.asmx?wsdl', function(err, client){
		client.Feed.FeedSoap.StyleFeed(function(err, result){
			for(var style in result.StyleFeedResult.Style){
				client.Feed.FeedSoap.ProductFeedForStyle({styleCode: result.StyleFeedResult.Style[style].Code}, function(err, result){
					var products = [];
					for(var product in result.ProductFeedForStyleResult.Product){
						products.push(result.ProductFeedForStyleResult.Product[product]);
					}
					console.log(products);
					/* APPEND PRODUCTS ARRAY TO STYLE ARRAY */
				});
				styles.push(result.StyleFeedResult.Style[style]);
			}
			res.send(styles);
		});
	});
});

app.get('/yummie/order/new', function(req, res){

	var Products = new Array();

	var obj = new Object();
	obj.barcode = "1234500003912";
	obj.qty = 1;
	Products.push(obj);

	var obj = new Object();
	obj.barcode = "1234500000010";
	obj.qty = 2;
	Products.push(obj);

	var person = new Object();
	person.firstName = "Jones";
	person.lastName = "Chris";
	person.address = "321 N Wayne Ave";
	person.postcode = "92833";
	person.suburb = "Fullerton";
	person.state = "CA";
	person.email = "chris@seedcms.com";
	person.phone = "0019494131049";
	person.optInMailingList = false;
	person.countryCodeISO3166_A2 = "US";

	var Order = new Object();
	Order.products = Products;
	Order.person = person;
	Order.refNo = "seedcms";

	var data = JSON.stringify({order: Order});
	var orderid = 0;
	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': data.length
	};
	var options = {
		host: 'dev8.nicheweb.com.au',
		port: 80,
		path: '/feed.asmx/CreateOrderTest',
		method: 'POST',
		headers: headers
	};
	var req = http.request(options, function(r){
		r.setEncoding('utf-8');
		var responseString = '';
		r.on('data', function(data){
			orderid = data;
		});
		r.on('end', function(){
			res.send(orderid);
		});
	});
	req.on('error', function(e){
		console.log(e)
	});

	var message = {
		"from_email": "mandrill@heyjones.com",
		"from_name": "Mandrill",
		"headers": {
			"Reply-To": "mandrill@heyjones.com"
		},
		"to": [{
			"email": "chris@heyjones.com",
			"name": "Chris Jones",
			"type": "to"
		}],
		"subject": "Order # " + orderid,
		"html": "<p>This is a test email from Mandrill</p>",
		"text": "This is a test email from Mandrill"
	};
	mandrill_client.messages.send({"message": message}, function(result){
		console.log(result);
	}, function(e){
		console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	});

	req.write(data);
	req.end();
	
});

app.get('/yummie/order/:id', function(req, res){

	var shit = new Object();
	shit.user = 'staff';
	shit.pass = 'staff';
	shit.id = req.params.id;
	var data = JSON.stringify(shit);
console.log(data);
	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': data.length
	};
	var options = {
		host: 'dev8.nicheweb.com.au',
		port: 80,
		path: '/feed.asmx/OrderStatusFeed',
		method: 'POST',
		headers: headers
	};
	var req = http.request(options, function(r){
		r.setEncoding('utf-8');
		var responseString = '';
		r.on('data', function(data){
			orderid = data;
		});
		r.on('end', function(){
			res.send(orderid);
		});
	});
	req.on('error', function(e){
		console.log(e)
	});
	req.write(data);
	req.end();
	
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, 'error');
});

var server = app.listen(process.env.PORT || 3000, function(){
	console.log('listening on port %d', server.address().port);
});
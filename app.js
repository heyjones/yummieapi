var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http');
var shopifyAPI = require('shopify-node-api');
var soap = require('soap');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('OUkg9XvLhLHqv9M51lOrAA');
var CronJob = require('cron').CronJob;
var async = require('async');

app.use(bodyParser.json());

app.get('/', function(req, res){
	res.send('howdy');
});

/* CREATE / UPDATE SHOPIFY PRODUCTS */

function nicheAPI(callback){
	soap.createClient('http://dev8.nicheweb.com.au/feed.asmx?wsdl', function nicheAPI(err, client){
		callback(client);
	});
}

function nicheStyles(client, callback){
	client.Feed.FeedSoap.StyleFeed(function(err, result){
		var styles = [];
		for(var style in result.StyleFeedResult.Style){
			styles.push(result.StyleFeedResult.Style[style]);
		}
		callback(styles);
	});
}

function nicheProducts(client, style, callback){
	client.Feed.FeedSoap.ProductFeedForStyle({styleCode: style.Code}, function(err, result){
		var products = [];
		for(var product in result.ProductFeedForStyleResult.Product){
			products.push(result.ProductFeedForStyleResult.Product[product]);
		}
		callback(products);
	});
}

new CronJob('1 * * * * *', function(){

	nicheAPI(function(client){
		nicheStyles(client, function(styles){
			for(style in styles){
				console.log(styles[style]);
				nicheProducts(client, styles[style], function(products){
					console.log(products);
				});
			}
		});
	});
/*
		client.Feed.FeedSoap.StyleFeed(function(err, result){
				for(var style in result.StyleFeedResult.Style){

			async.each(, function(style, callback){
				console.log(style);
				client.Feed.FeedSoap.ProductFeedForStyle({styleCode: style.Code}, function nicheStyleProducts(err, result){
					async.map(result.ProductFeedForStyleResult.Product, function nicheProduct(Product, callback){
						console.log(Product);
					});
				});
			});
	});


			async.eachSeries(result.StyleFeedResult.Style, function(Style, callback){

				console.log(Style);

				var variants = [];
				var price =  Style.WebPrice.LocalUnitPriceExTax1;
console.log(price);
				client.Feed.FeedSoap.ProductFeedForStyle({styleCode: Style.Code}, function(err, result){
					async.eachSeries(result.ProductFeedForStyleResult.Product, function(Product, callback){
						var variant = new Object();
						variant.barcode = 'BARCODE';
						variant.grams = Product.Weight;
						variant.inventory_quantity = Product.AvailableStock;
						variant.old_inventory_quantity = Product.AvailableStock;
						variant.option1 = Product.Color;
						variant.option2 = Product.Size;
						variant.price = price;
						variant.requires_shipping = true;
						variant.taxable = true;
						variant.title = Product.Color +' - '+ Product.Size;
						variants.push(variant);
console.log(variant);
						callback();
					});
				});
				callback();
			});
					async.eachSeries(result.ProductFeedForStyleResult.Product, function(Product, callback){
						variant = new Object();
						variant.barcode = 'BARCODE';
						variant.grams = grams;
						variant.inventory_quantity = Product.AvailableStock;
						variant.old_inventory_quantity = Product.AvailableStock;
						variant.option1 = Product.Color;
						variant.option2 = Product.Size;
						variant.price = price;
						variant.requires_shipping = true;
						variant.taxable = true;
						variant.title = Product.Color +' - '+ Product.Size;
						variants.push(variant);
					});
				});
				var Shopify = new shopifyAPI({
					shop: 'seedcms.myshopify.com',
					shopify_api_key: '89fa1ac4b082c6877427bd553b4f64a1',
					shopify_shared_secret: 'efced55c08389299d01b9fba89e6f303',
					access_token: 'f4eaa7a2a3da1a3c6d5d808b3737d0b1',
					verbose: false
				});
				var product = {
					'product': {
						'title': Style.Description,
						'body_html': Style.WebDescription,
						'vendor': Style.Label.Description,
						'product_type': Style.Category,
						'metafields': [
							{
								'key': 'EntityID',
								'value': Style.EntityID,
								'value_type': 'string',
								'namespace': 'seedcms'
							}
						],
						'images': [
							{
								'src': Style.WebMainPicture.ZoomBoxUrl
							}
						],
						'variants': variants
					}
				}
*/
/*
				Shopify.post('/admin/products.json', product, function(err, data, headers){
console.log(data);
				});
				client.Feed.FeedSoap.ProductFeedForStyle({styleCode: result.StyleFeedResult.Style[Style].Code}, function(err, result){
					/* CREATE / UPDATE SHOPIFY VARIANT */
/*
					for(var Product in result.ProductFeedForStyleResult.Product){
console.log(result.ProductFeedForStyleResult.Product[Product]);
					}
				});

			});
		});
	});

*/
}, null, true, 'America/Los_Angeles');

/* CREATE NICHE ORDER, CREATE SHOPIFY FULFILLMENT */
new CronJob('1 * * * * *', function(){
}, null, true, 'America/Los_Angeles');

/* CREATE NICHE ORDER, CREATE SHOPIFY FULFILLMENT */
app.post('/shopify/order/new', function(req, res){
	var orderNo = 0;
	var Products = new Array();
	for(line_item in req.body.line_items){
		var Product = new Object();
		Product.barcode = req.body.line_items[line_item].sku;
		Product.qty = req.body.line_items[line_item].quantity;
		Products.push(Product);
	}
	var Person = new Object();
	Person.firstName = req.body.customer.first_name;
	Person.lastName = req.body.customer.last_name;
	Person.address = req.body.shipping_address.address1;
	Person.postcode = req.body.shipping_address.zip;
	Person.suburb = req.body.shipping_address.city;
	Person.state = req.body.shipping_address.province_code;
	Person.email = req.body.email;
	Person.phone = req.body.shipping_address.phone;
	Person.optInMailingList = req.body.buyer_accepts_marketing;
	Person.countryCodeISO3166_A2 = req.body.customer.country_code;
	var Order = new Object();
	Order.products = Products;
	Order.person = Person;
	Order.refNo = req.body.id;
	var data = JSON.stringify({order: Order});
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
		r.on('data', function(data){
			orderNo = data;
		});
		r.on('end', function(){
console.log(orderNo);
			var Shopify = new shopifyAPI({
				shop: 'seedcms.myshopify.com',
				shopify_api_key: '89fa1ac4b082c6877427bd553b4f64a1',
				shopify_shared_secret: 'efced55c08389299d01b9fba89e6f303',
				access_token: 'f4eaa7a2a3da1a3c6d5d808b3737d0b1',
				verbose: false
			});
			var fulfillment = {
				'fulfillment': {
					'status': 'pending'
				}
			}
			Shopify.post('/admin/orders/'+req.body.id+'/fulfillments.json', fulfillment, function(err, data, headers){
console.log(data);
			});
		});
	});
	req.on('error', function(e){
		console.log(e)
	});
	req.write(data);
	req.end();
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

app.get('/shopify/order/:id/fulfillment/new', function(req, res){
	var id = req.params.id;
	var post_data = {
		'fulfillment': {
			'tracking_number': '123456789',
			'notify_customer': false
		}
	}
	var Shopify = new shopifyAPI({
		shop: 'seedcms.myshopify.com',
		shopify_api_key: '89fa1ac4b082c6877427bd553b4f64a1',
		shopify_shared_secret: 'efced55c08389299d01b9fba89e6f303',
		access_token: 'f4eaa7a2a3da1a3c6d5d808b3737d0b1',
		verbose: false
	});
	Shopify.post('/admin/orders/'+id+'/fulfillments.json', post_data, function(err, data, headers){
console.log(data);
	});
	res.send('done');
});

app.get('/niche/styles.json', function(req, res){
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
app.get('/niche/styles/:id/products.json', function(req, res){
	var style = req.params.id;
console.log(style);
	var products = [];
	soap.createClient('http://dev8.nicheweb.com.au/feed.asmx?wsdl', function(err, client){
		client.Feed.FeedSoap.ProductFeedForStyle({styleCode: style}, function(err, result){
			for(var product in result.ProductFeedForStyleResult.Product){
				products.push(result.ProductFeedForStyleResult.Product[product]);
			}
			res.send(products);
		});
	});
});

app.get('/niche/login', function(req, res){

	var login = new Object();
	login.userName = 'staff';
	login.password = 'staff';

	var data = JSON.stringify(login);

	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': data.length
	};

	var options = {
		host: 'dev8.nicheweb.com.au',
		port: 80,
		path: '/feed.asmx/LogIn',
		method: 'POST',
		headers: headers
	};

	var req = http.request(options, function(r){
		r.setEncoding('utf-8');
		r.on('data', function(data){
console.log(data);
		});
		r.on('end', function(){
		});
	});
	req.on('error', function(e){
		console.log(e)
	});
	req.write(data);
	req.end();

	res.send(data);
	res.end();

});

app.get('/niche/order/new', function(req, res){

/* 	LOGIN */

/* 	CREATE ORDER */

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

	var orderid = 0;

	var data = JSON.stringify({order: Order});
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

/* 			EMAIL */

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

		});
	});
	req.on('error', function(e){
		console.log(e)
	});

/* 	LOGOUT */

	req.write(data);
	req.end();
	
});

app.get('/niche/order/:id', function(req, res){

	var Order = new Object();
	Order.orderNo = req.params.id;

	var data = JSON.stringify(Order);

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
console.log('SHIT!:'+data);
		});
		r.on('end', function(){
		});
	});
	req.on('error', function(e){
		console.log(e)
	});
	req.write(data);
	req.end();

	res.send(data);
	res.end();
	
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, 'error');
});

var server = app.listen(process.env.PORT || 3000, function(){
	console.log('listening on port %d', server.address().port);
});
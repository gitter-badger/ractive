define([ 'ractive', 'helpers/Model' ], function ( Ractive, Model ) {

	'use strict';

	return function () {

		var fixture, adaptor;

		module( 'Adaptors' );

		// setup
		fixture = document.getElementById( 'qunit-fixture' );
		adaptor = Model.adaptor;

		test( 'Adaptors can change data as it is .set() (#442)', function ( t ) {
			var model, ractive;

			model = new Model({
				foo: 'BAR',
				percent: 150
			});

			model.transform( 'foo', function ( newValue, oldValue ) {
				return newValue.toLowerCase();
			});

			model.transform( 'percent', function ( newValue, oldValue ) {
				return Math.min( 100, Math.max( 0, newValue ) );
			});

			ractive = new Ractive({
				el: fixture,
				template: '<p>{{model.foo}}</p><p>{{model.percent}}</p>',
				data: {
					model: model
				},
				adapt: [ adaptor ]
			});

			t.htmlEqual( fixture.innerHTML, '<p>bar</p><p>100</p>' );

			ractive.set( 'model.foo', 'BAZ' );
			ractive.set( 'model.percent', -20 );
			t.htmlEqual( fixture.innerHTML, '<p>baz</p><p>0</p>' );

			ractive.set( 'model', {
				foo: 'QUX',
				percent: 50
			});
			t.htmlEqual( fixture.innerHTML, '<p>qux</p><p>50</p>' );
		});

		test( 'ractive.reset() calls are forwarded to wrappers if the root data object is wrapped', function ( t ) {
			var model, ractive;

			model = new Model({
				foo: 'BAR',
				unwanted: 'here'
			});

			model.transform( 'foo', function ( newValue, oldValue ) {
				return newValue.toLowerCase();
			});

			ractive = new Ractive({
				el: fixture,
				template: '<p>{{foo}}</p>{{unwanted}}',
				data: model,
				adapt: [ adaptor ]
			});

			ractive.reset({ foo: 'BAZ' });
			t.htmlEqual( fixture.innerHTML, '<p>baz</p>' );

			model = new Model({ foo: 'QUX' });

			model.transform( 'foo', function ( newValue, oldValue ) {
				return newValue.toLowerCase();
			});

			ractive.reset( model );
			t.htmlEqual( fixture.innerHTML, '<p>qux</p>' );
		});

		test( 'If a wrapper\'s reset() method returns false, it should be torn down (#467)', function ( t ) {
			var model1, model2, ractive;

			model1 = new Model({
				foo: 'bar'
			});

			model2 = new Model({
				foo: 'baz'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<p>{{model.foo}}</p>',
				data: { model: model1 },
				adapt: [ adaptor ]
			});

			t.htmlEqual( fixture.innerHTML, '<p>bar</p>' );

			ractive.set( 'model', model2 );
			t.htmlEqual( fixture.innerHTML, '<p>baz</p>' );
		});

		test( 'A string can be supplied instead of an array for the `adapt` option (if there\'s only one adaptor listed', function ( t ) {
			var Subclass, instance;

			Subclass = Ractive.extend({ adapt: 'Foo' });
			instance = new Subclass();

			t.deepEqual( instance.adapt, ['Foo'] );
		});

		test( 'Original values are passed to event handlers (#945)', function ( t ) {
			expect( 2 );

			var ractive = new Ractive({
				el: fixture,
				template: '{{#with model}}<button on-click="select:{{this}}">{{foo}}</button>{{/with}}',
				data: {
					model: new Model({ foo: 'bar' })
				},
				adapt: [ adaptor ]
			});

			t.htmlEqual( fixture.innerHTML, '<button>bar</button>' );

			ractive.on( 'select', function ( event, model ) {
				t.ok( model instanceof Model );
			});

			simulant.fire( ractive.find( 'button' ), 'click' );
		});

		test( 'Adaptor teardown is called when used in a component (#1190)', function ( t ) {
			var ractive, adaptor, Component, torndown = 0;

			function Wrapped(){}

			adaptor = {
				filter: obj => obj instanceof Wrapped,
				wrap: () => {
					return {
						get: () => ({ foo: 'bar' }),
						reset: () => false,
						teardown: () => torndown++
					}
				}
			}

			ractive = new Ractive({
				el: fixture,
				template: '<component/>',
				components: {
					component: Ractive.extend({
						template: '{{wrapped.foo}}',
						data: {
							wrapped: new Wrapped()
						},
						adapt: [ adaptor ]
					})
				}

			});

			t.htmlEqual( fixture.innerHTML, 'bar' );
			ractive.teardown();
			t.equal( torndown, 1 );
		});


		test( 'Adaptor called on data provided in initial options when no template (#1285)', function ( t ) {
			var ractive, adaptor, obj;

			function Wrapped(){}

			obj = new Wrapped();

			adaptor = {
				filter: obj => obj instanceof Wrapped,
				wrap: () => {
					return {
						get: () => obj,
						reset: () => false,
						set: (property, value) => obj.sekrit = value,
						teardown: () => true
					}
				}
			}

			ractive = new Ractive({
				el: fixture,
				data: { wrapped: obj },
				adapt: [ adaptor ]
			});

			t.ok( !obj.sekrit );
			t.ok( !obj.enabled );
			ractive.set('wrapped.enabled', true);
			t.ok( obj.sekrit, 'adaptor set should have been used to set sekrit property' );
			t.ok( !obj.enabled, 'object property should not have been set, adaptor should have been used'  );
		});
	};

});

/**
 * Copyright 2013, Twitter Inc. and other contributors
 * Licensed under the MIT License
 */

(function (root) {
  'use strict';

  jasmine.flight = {};

  /**
   * setupComponent
   * - Assumes it has been called in the context of a jasmine spec.
   * - Creates a new HTML element and attaches to it an instance of this.Component
   * - If a fixture is provided, the fixture will serve as the component root.
   *
   * @param fixture: HTML or jQuery fixture
   * @param options: component initialization options
   */
  function setupComponent (fixture, options) {
    // tear down any existing component instance
    if (this.component) {
      this.component.teardown();
      this.$node.remove();
    }

    if (fixture instanceof jQuery || typeof fixture === 'string') {
      // use the fixture to create component root node
      this.$node = $(fixture).addClass('component-root');
    } else {
      // create an empty component root node
      this.$node = $('<div class="component-root" />');
      options = fixture;
      fixture = null;
    }

    // append component root node to body
    $('body').append(this.$node);

    // normalize options
    options = options === undefined ? {} : options;

    // instantiate component on component root node
    this.component = (new this.Component()).initialize(this.$node, options);
  };

  /**
   * describeComponent wraps jasmine.Env.prototype.describeComponent, providing a global
   * variable to access the current jasmine environment
   *
   * @param componentPath
   * @param specDefinitions
   */
  root.describeComponent = function (componentPath, specDefinitions) {
    jasmine.getEnv().describeComponent(componentPath, specDefinitions);
  };
  jasmine.Env.prototype.describeComponent = function (componentPath, specDefinitions) {
    describe(componentPath, describeComponentFactory(componentPath, specDefinitions));
  };

  /**
   * ddescribeComponent wraps ddescribe
   *
   * @param componentPath
   * @param specDefinitions
   */
  root.ddescribeComponent = function (componentPath, specDefinitions) {
    jasmine.getEnv().ddescribeComponent(componentPath, specDefinitions);
  };
  jasmine.Env.prototype.ddescribeComponent = function (componentPath, specDefinitions) {
    ddescribe(componentPath, describeComponentFactory(componentPath, specDefinitions));
  };

  /**
   * describeComponentFactory
   * loads the specified amd component/mixin before executing specDefinitions
   * provides this.setupComponent
   * Component instances created with this.setupComponent are torn down after each spec
   *
   * @param componentPath
   * @param specDefinitions
   */
  function describeComponentFactory (componentPath, specDefinitions, isMixin) {
    return function () {

      // Function to deconstruct the component/mixin namespace
      function getComponent(componentPath) {
        var c = window;
        componentPath.split('.').forEach(function(d){
          c = c[d];
        })
        return c;
      };

      beforeEach(function (done) {
        // reset member variables
        this.Component = this.component = this.$node = null;

        // bind setupComponent to the current context
        this.setupComponent = setupComponent.bind(this);

        // reset the registry
        flight.registry.reset();

        if (isMixin) {
          // mix the mixin in to an anonymous, component
          this.Component = flight.component(function () {}, getComponent(componentPath));
        } else {
          this.Component = getComponent(componentPath);
        }
        // let Jasmine know we're good to continue with the tests
        done();
      });

      afterEach(function (done) {
        // remove the component root node
        if (this.$node) {
          this.$node.remove();
          this.$node = null;
        }

        // reset local member variables
        this.component = null;
        this.Component = null;
        // teardown all flight components
        flight.component.teardownAll();
        done();

      });

      specDefinitions.apply(this);
    };
  };

  /**
   * Wrapper for describe.
   *
   * @param mixinPath
   * @param specDefinitions
   */
  root.describeMixin = function (mixinPath, specDefinitions) {
    jasmine.getEnv().describeMixin(mixinPath, specDefinitions);
  };
  jasmine.Env.prototype.describeMixin = function (mixinPath, specDefinitions) {
    describe(mixinPath, describeMixinFactory(mixinPath, specDefinitions));
  };

  /**
   * Wrapper for ddescribe.
   *
   * @param mixinPath
   * @param specDefinitions
   */
  root.ddescribeMixin = function (mixinPath, specDefinitions) {
    jasmine.getEnv().ddescribeMixin(mixinPath, specDefinitions);
  };
  jasmine.Env.prototype.ddescribeMixin = function (mixinPath, specDefinitions) {
    ddescribe(mixinPath, describeMixinFactory(mixinPath, specDefinitions));
  };

  /**
   * describeMixinFactory is a wrapper for describeComponentFactory
   * Loads amd mixin as a component before executing specDefinitions
   *
   * @param componentPath
   * @param specDefinitions
   */
  function describeMixinFactory (mixinPath, specDefinitions) {
    return describeComponentFactory(mixinPath, specDefinitions, true);
  };

}(this));

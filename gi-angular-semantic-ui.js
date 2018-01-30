/**
 * gi-semantic-ui-angular - 1.0.0
 * Angular1 Directives for Semantic UI
 * 
 * https://github.com/ginvoicing/gi-semantic-ui-angular
 * Released under the MIT license.
 * Copyright 2018 Ginvoicing and contributors.
 */

angular.module('semantic-ui', [
  'semantic-ui-core',
  'semantic-ui-checkbox',
  'semantic-ui-radio',
  'semantic-ui-dropdown',
]);

(function(app)
{

  app
    .factory('SemanticUI', ['$compile', SemanticUIFactory])
    .directive('smButton', SemanticButton)
    .directive('smMenuItem', SemanticItem)
    .directive('smFlatMenu', SemanticFlatMenu)
    .directive('smHtml', ['$injector', SemanticHtml])
  ;

  function SemanticUIFactory($compile)
  {
    var SemanticUI =
    {
      setDefaultFunction: function(scope, variable, attributes, func)
      {
        if ( !attributes[ variable ] )
        {
          scope[ variable ] = func;
        }
      },
      triggerChange: function(scope, variable, element, initialized)
      {
        scope.$watch( variable, function(updated)
        {
          // Don't trigger the change event if the element hasn't been initialized.
          if ( initialized )
          {
            // Trigger the change event during a digest cycle so any other
            // variables that are changing this current digest cycle can finish.
            scope.$evalAsync(function()
            {
              element.trigger('change');
            });
          }

          initialized = true;
        })
      },
      bindAttribute: function(scope, variable, element, attribute)
      {
        scope.$watch( variable, function(updated)
        {
          element.attr( attribute, updated );
        });
      },
      onEvent: function(settings, evt, func)
      {
        settings[ evt ] = (function(existing, undefined)
        {
          return function EventHandler()
          {
            var result0 = undefined;

            if ( angular.isFunction( existing ) )
            {
              result0 = existing.apply( this, arguments );
            }

            var result1 = func.apply( this, arguments );

            return ( result0 !== undefined ? result0 : result1 );
          }
        })( settings[ evt ] );
      },
      linkEvents: function(scope, settings, defaults, linkings)
      {
        for (var evt in linkings)
        {
          (function(variable, evt)
          {
            SemanticUI.onEvent( settings, evt, function()
            {
              var scopeValue = scope[ variable ];

              if ( angular.isFunction( scopeValue ) )
              {
                return scopeValue.apply( this, arguments );
              }
              else if ( angular.isFunction( defaults[ evt ] ) )
              {
                return defaults[ evt ].apply( this, arguments );
              }
            });

          })( linkings[ evt ], evt );
        }
      },
      linkSettings: function(scope, element, attributes, module, initialized, settingsAttribute)
      {
        var settings = settingsAttribute || 'settings';

        if ( settings in attributes )
        {
          scope.$watch( settings, function( updated )
          {
            if ( initialized )
            {
              angular.forEach( updated, function(value, key)
              {
                element[ module ]( 'setting', key, value );
              });
            }

            initialized = true;

          }, true );
        }
      },
      createBind: function(attribute, module)
      {
        return {

          restrict: 'A',

          link: function(scope, element, attributes)
          {
            SemanticUI.linkSettings( scope, element, attributes, module, false, attribute );
            SemanticUI.initBind( scope, element, attributes, attribute, module );
          }
        };
      },
      initBind: function(scope, element, attributes, attribute, module)
      {
        element.ready(function()
        {
          var settings = {};
          var input = attributes[ attribute ];

          if ( input )
          {
            settings = scope.$eval( input );
          }

          element[ module ]( settings );
        });
      },
      createBehavior: function(attribute, module, method)
      {
        return {

          restrict: 'A',

          link: function(scope, element, attributes)
          {
            SemanticUI.initBehavior( scope, attributes, attribute, element, module, method );
          }
        };
      },
      initBehavior: function(scope, attributes, attribute, element, module, method)
      {
        // Default settings on the attribute.
        var settings = {
          $: undefined,
          evt: 'click',
          enabled: true,
          value: undefined
        };

        var onEvent = function()
        {
          // If the trigger is currently enabled...
          if ( settings.enabled )
          {
            // Call the method on the module.
            $( settings.$ )[ module ]( method, settings.value );
          }
        };

        var previousEvent = false;

        scope.$watch( attributes[ attribute ], function(input)
        {
          // If the attribute value is a string, take it as the selector
          if ( angular.isString( input ) )
          {
            settings.$ = input;
          }
          // If the attribute value is an object, overwrite the defaults.
          else if ( angular.isObject( input ) )
          {
            if ( !angular.isString( input.evt ) ) input.evt = settings.evt;
            if ( !angular.isDefined( input.enabled ) ) input.enabled = settings.enabled;

            settings = input;
          }

          if ( previousEvent )
          {
            element.off( previousEvent, onEvent );
          }

          element.on( previousEvent = settings.evt, onEvent );

        }, true );
      },
      watcher: function (scope, expression, func, context, force, equals) 
      {
          var currentValue = angular.copy(scope[expression]);

          scope.$watch(expression, function (updated) 
          {
              if (expression != 'model' || !angular.equals(currentValue, updated)) 
              {
                  func.call(context, updated);
              }

          }, equals);

          return {
              set: function (value) 
              {
                  if (scope[expression] != value || force) 
                  {
                      scope.$evalAsync(function () 
                      {
                          scope[expression] = value;
                          currentValue = angular.copy(scope[expression]);
                      });
                  }
              },
              update: function () 
              {
                  scope.$evalAsync(function () 
                  {
                  });
              }
          }
      },
      RecursiveCompiler: function(postLink)
      {
        return function(element, link)
        {
          // Normalize the link parameter
          if( angular.isFunction( link ) )
          {
              link = { post: link };
          }

          // Break the recursion loop by removing the contents
          var contents = element.contents().remove();
          var compiledContents;

          return {
              pre: (link && link.pre) ? link.pre : null,
              /**
               * Compiles and re-adds the contents
               */
              post: function(scope, element)
              {
                  // Compile the contents
                  if( !compiledContents )
                  {
                      compiledContents = $compile(contents);
                  }

                  // Re-add the compiled contents to the element
                  compiledContents( scope, function(clone)
                  {
                      element.append(clone);
                  });

                  // Call the post-linking function, if any
                  if ( link && link.post )
                  {
                      link.post.apply( null, arguments );
                  }

                  if ( angular.isFunction( postLink ) )
                  {
                    postLink.apply( null, arguments );
                  }
              }
          };
        };
      }
    };

    return SemanticUI;
  }

  function SemanticButton()
  {
    return {

      restrict: 'E',

      replace: true,

      transclude: true,

      template: '<button class="ui button" ng-transclude></button>'
    };
  }

  function SemanticItem()
  {
    return {

      restrict: 'E',

      replace: true,

      transclude: true,

      scope: {
        icon: '@'
      },

      template: '<a class="item"><i class="{{ icon }} icon" ng-if="icon"></i><span ng-transclude></span></a>'
    }
  }

  function SemanticFlatMenu()
  {
    return {

      restrict: 'E',

      replace: true,

      template: [
        '<div class="menu">',
        '  <div class="item" ng-repeat="item in items" data-value="{{ getValue(item) }}" sm-html="label({item:item})"></div>',
        '</div>'
      ].join('\n')
    }
  }

  function SemanticHtml($injector)
  {
    var sanitize = function(value)
    {
      return value;
    };

    try
    {
      $sce = $injector.get('$sce');

      sanitize = function(value)
      {
        return $sce.getTrustedHtml( $sce.trustAsHtml( value ) );
      };
    }
    catch (e)
    {
      // ignore
    }

    return function(scope, element, attrs)
    {
      scope.$watch( attrs.smHtml, function(value)
      {
        element.html( sanitize( value || '' ) );
      });
    };
  }

})( angular.module('semantic-ui-core', []) );

(function(app)
{

  app
    .factory('SemanticCheckboxLink', ['SemanticUI', SemanticCheckboxLink])
    .directive('giCheckboxBind', ['SemanticUI', SemanticCheckboxBind])
    .directive('giCheckbox', ['SemanticCheckboxLink', SemanticCheckbox])
  ;

  var BEHAVIORS = {
    giCheckboxToggle:            'toggle',
    giCheckboxCheck:             'check',
    giCheckboxUncheck:           'uncheck',
    giCheckboxIndeterminate:     'indeterminate',
    giCheckboxDeterminate:       'determinate',
    giCheckboxEnable:            'enable',
    giCheckboxDisable:           'disable'
  };

  angular.forEach( BEHAVIORS, function(method, directive)
  {
    app.directive( directive, ['SemanticUI', function(SemanticUI)
    {
      return SemanticUI.createBehavior( directive, 'checkbox', method );
    }]);
  });

  function SemanticCheckboxBind(SemanticUI)
  {
    return SemanticUI.createBind( 'giCheckboxBind', 'checkbox' );
  }

  function SemanticCheckbox(SemanticCheckboxLink)
  {
    return {

      restrict: 'E',

      replace: true,

      transclude: true,

      scope: {
        /* Required */
        model: '=',
        label: '@',
        /* Optional */
        settings: '=',
        enabled: '=',
        indeterminateValue: '=',
        checkedValue: '=',
        uncheckedValue: '=',
        children: '@',
        onInit: '=',
        /* Events */
        onChange:        '=',
        onChecked:       '=',
        onIndeterminate: '=',
        onDeterminate:   '=',
        onUnchecked:     '=',
        onEnable:        '=',
        onDisable:       '='
      },

      template: [
        '<div class="ui checkbox">',
        '  <input type="checkbox">',
        '  <label>{{ label }}</label>',
        '</div>'
      ].join('\n'),

      link: SemanticCheckboxLink
    };
  }

  function SemanticCheckboxLink(SemanticUI)
  {
    return function(scope, element, attributes)
    {
      element.ready(function()
      {
        var settings = scope.settings || {};

        SemanticUI.linkSettings( scope, element, attributes, 'checkbox', true );

        SemanticUI.triggerChange( scope, 'model', element, true );

        var checkedValue = function() {
          return angular.isDefined( scope.checkedValue ) ? scope.checkedValue : true;
        };
        var uncheckedValue = function() {
          return angular.isDefined( scope.uncheckedValue ) ? scope.uncheckedValue : false;
        };
        var indeterminateValue = function() {
          return angular.isDefined( scope.indeterminateValue ) ? scope.indeterminateValue : void 0;
        };

        if ( attributes.enabled )
        {
          var enabledWatcher = SemanticUI.watcher( scope, 'enabled',
            function(updated) {
              if ( angular.isDefined( updated ) ) {
                element.checkbox( updated ? 'set enabled' : 'set disabled' );
              }
            }
          );

          SemanticUI.onEvent( settings, 'onEnable',
            function(value) {
              enabledWatcher.set( true );
            }
          );

          SemanticUI.onEvent( settings, 'onDisable',
            function(value) {
              enabledWatcher.set( false );
            }
          );
        }

        var modelWatcher = SemanticUI.watcher( scope, 'model',
          function(updated) {
            if ( angular.isDefined( updated ) ) {
              element.checkbox( updated ? 'set checked' : 'set unchecked' );
            }
          }
        );

        SemanticUI.onEvent( settings, 'onChecked',
          function() {
            modelWatcher.set( checkedValue() );
          }
        );

        SemanticUI.onEvent( settings, 'onUnchecked',
          function() {
            modelWatcher.set( uncheckedValue() );
          }
        );

        SemanticUI.onEvent( settings, 'onIndeterminate',
          function() {
            modelWatcher.set( indeterminateValue() );
          }
        );

        SemanticUI.linkEvents( scope, settings, $.fn.checkbox.settings, {
          onChange:        'onChange',
          onChecked:       'onChecked',
          onIndeterminate: 'onIndeterminate',
          onDeterminate:   'onDeterminate',
          onUnchecked:     'onUnchecked',
          onEnable:        'onEnable',
          onDisable:       'onDisable'
        });

        // If the checkbox has children, link the value of this checkbox to the children
        if ( scope.children )
        {
          var $children = $( scope.children );
          var settingChildren = false;

          SemanticUI.onEvent( settings, 'onChecked',
            function() {
              settingChildren = true;
              $children.checkbox( 'check' );
              settingChildren = false;
            }
          );
          SemanticUI.onEvent( settings, 'onUnchecked',
            function() {
              settingChildren = true;
              $children.checkbox( 'uncheck' );
              settingChildren = false;
            }
          );

          $children.children('input[type=checkbox], input[type=radio]')
            .change(function() {

              if ( settingChildren ) {
                return;
              }

              var checked = 0;

              $children.each(function(i, child) {
                if ( $( child ).checkbox( 'is checked') ) {
                  checked++;
                }
              });

              if ( checked === 0 ) {
                element.checkbox( 'uncheck' );
              }
              else if ( checked === $children.length ) {
                element.checkbox( 'check' );
              }
              else {
                element.checkbox( 'indeterminate' );
              }
            })
          ;
        }

        // Initialize the element with the given settings.
        element.checkbox( settings );

        // Set initial state of the checkbox
        if ( scope.model == checkedValue() )
        {
          element.checkbox( 'set checked' );
        }
        else if ( scope.model === indeterminateValue() )
        {
          element.checkbox( 'set indeterminate' );
        }

        if ( angular.isDefined( scope.enabled ) && !scope.enabled )
        {
          element.checkbox( 'set disabled' );
        }

        if ( angular.isFunction( scope.onInit ) ) {
          scope.onInit( element );
        }
      });
    };
  }

})( angular.module('semantic-ui-checkbox', ['semantic-ui-core']) );

(function(app)
{

  app
    .controller('SemanticDropdownController', ['$scope', SemanticDropdownController])
    .factory('SemanticDropdownLink', ['SemanticUI', '$timeout', SemanticDropdownLink])
    .directive('giDropdownBind', ['SemanticUI', SemanticDropdownBind])
    .directive('giDropdown', ['SemanticDropdownLink', SemanticDropdown])
  ;

  var BEHAVIORS = {
    giDropdownToggle:               'toggle',
    giDropdownShow:                 'show',
    giDropdownHide:                 'hide',
    giDropdownClear:                'clear',
    giDropdownHideOthers:           'hide others',
    giDropdownRestoreDefaults:      'restore defaults',
    giDropdownRestoreDefaultText:   'restore default text',
    giDropdownRestoreDefaultValue:  'restore default value',
    giDropdownSaveDefaults:         'save defaults',
    giDropdownSetSelected:          'set selected',
    giDropdownSetText:              'set text',
    giDropdownSetValue:             'set value',
    giDropdownBindTouchEvents:      'bind touch events',
    giDropdownMouseEvents:          'mouse events',
    giDropdownBindIntent:           'bind intent',
    giDropdownUnbindIntent:         'unbind intent',
    giDropdownSetActive:            'set active',
    giDropdownSetVisible:           'set visible',
    giDropdownRemoveActive:         'remove active',
    giDropdownRemoveVisible:        'remove visible'
  };

  angular.forEach( BEHAVIORS, function(method, directive)
  {
    app.directive( directive, ['SemanticUI', function(SemanticUI)
    {
      return SemanticUI.createBehavior( directive, 'dropdown', method );
    }]);
  });

  function SemanticDropdownBind(SemanticUI)
  {
    return SemanticUI.createBind( 'giDropdownBind', 'dropdown' );
  }

  function SemanticDropdown(SemanticDropdownLink)
  {
    return {

      restrict: 'E',

      replace: true,

      transclude: true,

      scope: {
        /* Required */
        model: '=',
        items: '=',
        label: '&',
        value: '&',
        /* Optional */
        settings: '=',
        defaultText: '=',
        onInit: '=',
        emptyValue: '=',
        /* Events */
        onChange: '=',
        onAdd: '=',
        onRemove: '=',
        onLabelCreate: '=',
        onLabelSelect: '=',
        onNoResults: '=',
        onShow: '=',
        onHide: '='
      },

      template: [
        '<div class="ui dropdown">',
          '<i class="dropdown icon"></i>',
          '<div class="text" ng-class="::{default: hasDefault()}" sm-html="::getDefaultText()"></div>',
          '<sm-flat-menu></sm-flat-menu>',
        '</div>'
      ].join('\n'),

      controller: 'SemanticDropdownController',

      link: SemanticDropdownLink
    };
  }

  function SemanticDropdownController($scope)
  {
    var hashMap = {};

    // Returns the value to be placed in the data-value attribute. If the computed value has a $$hashKey,
    // then return the hashKey. This enables the exact instance of the item to be set to the model.
    $scope.getValue = function(item)
    {
      // Computes the value given the expression in the 'value' attribute
      return $scope.getKey( $scope.value( {item: item} ) );
    };

    $scope.getKey = function(value)
    {
      return (value ? value.$$hashKey || value : value) + '';
    };

    $scope.isEmpty = function()
    {
      return !$scope.model || $scope.model.length === 0;
    };

    // Translates the value (the model, an item of the model, or a variable
    // created from the value function) into the key that's stored on the dropdown.
    $scope.translateValue = function(value)
    {
      var translated = $scope.getKey( value );
      var matching = $scope.findMatchingItem( translated );

      if ( angular.isDefined( matching ) )
      {
        return $scope.getValue( matching );
      }
    };

    // Determines whether this dropdown should currently display the default text.
    $scope.hasDefault = function()
    {
      return ( $scope.defaultText && $scope.isEmpty() );
    };

    // Gets the current text for the drop down. If the current model has a value which is found
    // in the items, the appropriate item's label is displayed. Otherwise return the default text.
    $scope.getDefaultText = function()
    {
      var defaultText = $scope.defaultText ? $scope.defaultText : '';
      return ( $scope.isEmpty() ? defaultText : $scope.translateValue($scope.findMatchingItem($scope.model)) );
    };

    // Finds an item instance that has the exact same value as the given value.
    $scope.findMatchingItem = function(value)
    {
      return hashMap[ value ];
    };

    // Updates the hash map providing a mapping from values to items.
    $scope.updateHashMap = function( items )
    {
      hashMap = {};

      angular.forEach( items, function(item)
      {
        hashMap[ $scope.getValue( item ) ] = item;
      });
    };
  }

  function SemanticDropdownLink(SemanticUI, $timeout)
  {
    return function (scope, element, attributes) {
      var applyValue = function (value) {
        $timeout(function () {
          if (value === null) {
            element.dropdown('clear');
          } else if(value === false){
            // Do nothing
          }
          else if (element.dropdown('is multiple')) {
            if (value instanceof Array) {
              var translatedValue = [];

              for (var i = 0; i < value.length; i++) {
                var translated = scope.translateValue(value[ i ]);

                if (angular.isDefined(translated)) {
                  translatedValue.push(translated);
                }
              }

              element.dropdown('set exactly', translatedValue);
            }
          } else {
            element.dropdown('set selected', scope.translateValue(value));
          }
        }, 0);
      };

      SemanticUI.setDefaultFunction( scope, 'label', attributes, function(locals){return locals.item} );
      SemanticUI.setDefaultFunction( scope, 'value', attributes, function(locals){return locals.item} );

      element.ready(function()
      {
        var settings = scope.settings || {};
        var ignoreChange = true;

        SemanticUI.linkSettings( scope, element, attributes, 'dropdown', true );

        SemanticUI.triggerChange( scope, 'model', element, true );

        // Returns the model on the scope, converting it to an array if it's not one.
        var modelArray = function() {
          if ( !(scope.model instanceof Array) ) {
            scope.model = scope.model ? [ scope.model ] : [];
          }
          return scope.model;
        };

        // When the model changes, set the value on the drop down
        var modelWatcher = SemanticUI.watcher( scope, 'model',
          function(updated) {
            applyValue( updated );
          }
        , null, true, true );

        // Inject an onChange function into the settings which sets the model value
        // and causes the scope to be updated.
        SemanticUI.onEvent( settings, 'onChange',
          function(value) {
            if ( ignoreChange ) {
              return;
            }
            if ( !element.dropdown('is multiple') ) {
              var mapped = scope.findMatchingItem( value );
              if (angular.isDefined(mapped)) {
                var mappedValue = scope.value({item: mapped});
                modelWatcher.set( mappedValue );
              } else if ( element.dropdown('setting', 'allowAdditions') ) {
                modelWatcher.set( value );
              } else {
                modelWatcher.set( scope.emptyValue );
              }
            }
          }
        );

        // When a new item is selected for multiple selection dropdowns, add it to the model.
        SemanticUI.onEvent( settings, 'onAdd',
          function(value) {
            if ( ignoreChange ) {
              return;
            }
            var mapped = scope.findMatchingItem( value );
            if (angular.isDefined(mapped)) {
              var mappedValue = scope.value({item: mapped});
              var indexOf = $.inArray( mappedValue, modelArray() );
              if ( indexOf === -1 ) {
                scope.model.push( mappedValue );
                modelWatcher.update();
              }
            } else if ( element.dropdown('setting', 'allowAdditions') ) {
              scope.model.push( value );
              modelWatcher.update();
            }
          }
        );

        // When an item is deselected for multiple selection dropdowns, remove it from the model.
        SemanticUI.onEvent( settings, 'onRemove',
          function(value) {
            if ( ignoreChange ) {
              return;
            }
            var mapped = scope.findMatchingItem( value );
            if (angular.isDefined(mapped)) {
              var mappedValue = scope.value({item: mapped});
              var indexOf = $.inArray( mappedValue, modelArray() );
              if ( indexOf !== -1 ) {
                scope.model.splice( indexOf, 1 );
                modelWatcher.update();
              }
            } else {
              var indexOf = $.inArray( value, modelArray() );
              if ( indexOf !== -1 ) {
                scope.model.splice( indexOf, 1 );
                modelWatcher.update();
              }
            }
          }
        );

        SemanticUI.linkEvents( scope, settings, $.fn.dropdown.settings, {
          onChange:       'onChange',
          onAdd:          'onAdd',
          onRemove:       'onRemove',
          onLabelCreate:  'onLabelCreate',
          onLabelSelect:  'onLabelSelect',
          onNoResults:    'onNoResults',
          onShow:         'onShow',
          onHide:         'onHide'
        });

        // When items changes, rebuild the hashMap & reapply the values.
        scope.$watch( 'items', function( updated )
        {
          scope.updateHashMap( scope.items );
          applyValue( scope.model );

        }, true );

        // Initialize the element with the given settings.
        element.dropdown( settings );

        // Update the hashmap with items
        scope.updateHashMap( scope.items );

        // Apply current value
        applyValue( scope.model );

        // Save defaults
        element.dropdown( 'save defaults' );

        // Stop ignoring changes!
        ignoreChange = false;

        // Notify initialized callback.
        if ( angular.isFunction( scope.onInit ) )
        {
          scope.onInit( element );
        }

      });
    };
  }

})( angular.module('semantic-ui-dropdown', ['semantic-ui-core']) );

(function(app)
{

  app
    .factory('SemanticRadioLink', ['SemanticUI', SemanticRadioLink])
    .directive('giRadioBind', ['SemanticUI', SemanticRadioBind])
    .directive('giRadio', ['SemanticRadioLink', SemanticRadio])
  ;

  var BEHAVIORS = {
    giRadioCheck:             'check',
    giRadioEnable:            'enable',
    giRadioDisable:           'disable'
  };

  angular.forEach( BEHAVIORS, function(method, directive)
  {
    app.directive( directive, ['SemanticUI', function(SemanticUI)
    {
      return SemanticUI.createBehavior( directive, 'checkbox', method );
    }]);
  });

  function SemanticRadioBind(SemanticUI)
  {
    return SemanticUI.createBind( 'giRadioBind', 'checkbox' );
  }

  function SemanticRadio(SemanticRadioLink)
  {
    return {

      restrict: 'E',

      replace: true,

      transclude: true,

      scope: {
        /* Required */
        model: '=',
        label: '@',
        name: '@',
        value: '=',
        /* Optional */
        settings: '=',
        enabled: '=',
        onInit: '=',
        /* Events */
        onChange:        '=',
        onChecked:       '=',
        onUnchecked:     '=',
        onEnable:        '=',
        onDisable:       '='
      },

      template: [
        '<div class="ui radio checkbox">',
        '  <input name="{{ name }}" type="radio">',
        '  <label>{{ label }}</label>',
        '</div>'
      ].join('\n'),

      link: SemanticRadioLink
    };
  }

  function SemanticRadioLink(SemanticUI)
  {
    return function(scope, element, attributes)
    {
      element.ready(function()
      {
        var settings = scope.settings || {};

        SemanticUI.linkSettings( scope, element, attributes, 'checkbox', true );

        SemanticUI.triggerChange( scope, 'model', element, true );

        if ( attributes.enabled )
        {
          var enabledWatcher = SemanticUI.watcher( scope, 'enabled',
            function(updated) {
              if ( angular.isDefined( updated ) ) {
                element.checkbox( updated ? 'set enabled' : 'set disabled' );
              }
            }
          );

          SemanticUI.onEvent( settings, 'onEnable',
            function(value) {
              enabledWatcher.set( true );
            }
          );

          SemanticUI.onEvent( settings, 'onDisable',
            function(value) {
              enabledWatcher.set( false );
            }
          );
        }

        var modelWatcher = SemanticUI.watcher( scope, 'model',
          function(updated) {
            if ( updated === scope.value ) {
              element.checkbox( 'set checked' );
            }
          }
        );

        SemanticUI.onEvent( settings, 'onChecked',
          function() {
            modelWatcher.set( scope.value );
          }
        );

        SemanticUI.linkEvents( scope, settings, $.fn.checkbox.settings, {
          onChange:        'onChange',
          onChecked:       'onChecked',
          onUnchecked:     'onUnchecked',
          onEnable:        'onEnable',
          onDisable:       'onDisable'
        });

        // Initialize the element with the given settings.
        element.checkbox( settings );

        // Set initial state of the radio
        if ( scope.model === scope.value )
        {
          element.checkbox( 'set checked' );
        }

        // If the radio is a slider, remove the radio class
        if ( element.hasClass( 'slider' ) )
        {
          element.removeClass( 'radio' );
        }

        if ( angular.isDefined( scope.enabled ) && !scope.enabled )
        {
          element.checkbox( 'set disabled' );
        }

        if ( angular.isFunction( scope.onInit ) ) {
          scope.onInit( element );
        }
      });
    };
  }

})( angular.module('semantic-ui-radio', ['semantic-ui-core']) );

/**
 * Directive responsible for setting focus on given HTML element on condition. Right after the the boolean value
 * passed to 'focus-on-true' evaluates to true, HTML tag with that attribute will be focused.
 * @author mc
 */
export default ['$timeout',
    function ($timeout: angular.ITimeoutService): angular.IDirective {
        return {
            link: function ($scope: angular.IScope, $element: angular.IAugmentedJQuery): void {
                $scope.$watch('focusOnTrue', (shouldFocus: boolean): void => {
                    if (shouldFocus === true) {
                        $timeout((): void => {
                            $element[0].focus();
                        });
                    }
                });
            },
            restrict: 'A',
            scope: {
                focusOnTrue: '<'
            }
        };
    }
];

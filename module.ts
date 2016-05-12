import {BasicSearchComponent} from './src/BasicSearchComponent.ts';
import FocusOnTrueDirective from './src/FocusOnTrueDirective.ts';

angular.module('search', [])
    .component('basicSearch', new BasicSearchComponent())
    .directive('focusOnTrue', FocusOnTrueDirective)
    .service('SearchService', SearchService);

import {SearchService} from '../SearchService.ts';
import {ISearchParameter} from './ISearchParameter.ts';

/**
 * Component responsible for displaying the basic search widget.
 * @author msucheck
 */
export class BasicSearchComponent {
    public template: string = `
<div class="basic-search" ng-class="{active: $ctrl.focus}" ng-init="$ctrl.focus = false;"
     ng-click="!$ctrl.focus ? $ctrl.searchFocus = true : null">
    <div>
        <div class="search-parameter" ng-repeat="param in $ctrl.usedParameters" title="{{::param.hint}}">
            <div class="key" ng-click="$ctrl.enterEditMode($event, $index)">{{::param.name}}:</div>
            <div class="value">
                <span ng-show="!param.editMode" ng-click="$ctrl.enterEditMode($event, $index)">
                    {{param.value}}
                </span>
                <input name="value" type="{{param.type}}" placeholder="{{::param.placeholder}}" ng-show="param.editMode"
                       ng-model="param.value" focus-on-true="param.editMode" ng-focus="$ctrl.focus = true;"
                       ng-blur="$ctrl.leaveEditMode($index)" ng-click="$ctrl.enterEditMode($event, $index)" 
                       ng-keydown="$ctrl.keydown($event, $index)" ng-change="$ctrl.searchParamValueChanged(param)" 
                       uib-typeahead="value.name for value in $ctrl.getAutocompleteValues(param, $viewValue)"
                       typeahead-on-select="$ctrl.searchParamTypeaheadOnSelect($item, param)"
                       typeahead-select-on-blur="false" typeahead-editable="true" typeahead-select-on-exact="true"/>
            </div>
            <span class="remove-icon fa fa-times" ng-click="$ctrl.removeSearchParam($index)" role="button"></span>
        </div>
        <input name="searchbox" class="search-parameter-input" type="text" placeholder="{{::$ctrl.placeholder}}" 
               focus-on-true="$ctrl.searchFocus" ng-model="$ctrl.searchQuery" autofocus
               ng-change="$ctrl.searchQueryChanged($ctrl.searchQuery)" ng-keydown="$ctrl.keydown($event)" 
               ng-focus="$ctrl.focus = true;" ng-blur="$ctrl.focus = false; $ctrl.searchFocus = false;"
       uib-typeahead="p as p.name for p in $ctrl.availableParameters | filter:$ctrl.isUnused | filter:{name:$viewValue}"
               typeahead-on-select="$ctrl.searchQueryTypeaheadOnSelect($item)"/>
        <span ng-show="$ctrl.usedParameters.length > 0 || $ctrl.searchQuery.length > 0" class="fa fa-lg fa-times-circle"
              ng-click="$ctrl.removeAll()" role="button"></span>
    </div>
    <div class="parameter-suggestions" ng-show="$ctrl.availableParameters">
        <span class="title">{{::$ctrl.parametersLabel}}:</span>
        <span ng-repeat="param in $ctrl.availableParameters | filter:$ctrl.isUnused | limitTo:$ctrl.parametersLimit"
              class="search-parameter" ng-mousedown="$ctrl.addSearchParam(param)" title="{{::param.hint}}">
            {{::param.name}}
        </span>
    </div>
</div>
`;
    public bindings: any = {
        model: '=ngModel',
        availableParameters: '<parameters',
        parametersLabel: '@',
        parametersLimit: '<?',
        placeholder: '@'
    };
    public controller: Function = BasicSearchController;
}
class BasicSearchController {
    public static $inject: string[] = ['$scope', '$timeout', '$http', 'SearchService'];

    // settings
    public availableParameters: Array<ISearchParameter>;
    public parametersLabel: string;
    public parametersLimit: number;
    public placeholder: string;

    // output 
    public model: any;

    // state
    private usedParameters: Array<ISearchParameter>;
    private searchQuery: string;
    private searchFocus: boolean;

    private static getCurrentCaretPosition(input: any): number {
        try {
            return input.selectionDirection === 'backward' ? input.selectionStart : input.selectionEnd;
        } catch (err) {
            // selectionStart is not supported by this input type, so just ignore it
        }
        return 0;
    }

    constructor(private $scope: angular.IScope, private $timeout: angular.ITimeoutService,
                private $http: angular.IHttpService, private searchService: SearchService) {
        // initialize the default values
        this.parametersLabel = this.parametersLabel || 'Available parameters';
        this.parametersLimit = this.parametersLimit || 8;
        this.placeholder = this.placeholder || 'Search...';
        this.usedParameters = [];
        this.searchQuery = '';
        this.searchFocus = false;
        this.model = {};
    }

    public searchParamValueChanged(param: ISearchParameter): void {
        this.updateModel('change', param.key, param.value);
    }

    public searchQueryChanged(query: string): void {
        this.updateModel('change', 'query', query);
    }

    public enterEditMode(event: Event, index: number): void {
        if (event !== undefined) {
            event.stopPropagation();
        }

        if (index !== undefined && index >= 0) {
            let searchParam: ISearchParameter = this.usedParameters[index];
            searchParam.editMode = true;
        }
    }

    public leaveEditMode(index: number): void {
        if (index !== undefined) {
            let searchParam: ISearchParameter = this.usedParameters[index];
            searchParam.editMode = false;

            // remove empty search params
            if (!searchParam.value) {
                this.removeSearchParam(index);
            }
        }
    }

    public searchQueryTypeaheadOnSelect(parameter: ISearchParameter): void {
        this.addSearchParam(parameter, undefined, undefined);
        this.searchQuery = '';
        this.updateModel('delete', 'query', undefined);
    }

    public searchParamTypeaheadOnSelect(suggestedValue: any, searchParam: ISearchParameter): void {
        searchParam.value = suggestedValue;
        this.searchParamValueChanged(searchParam);
    }

    public isUnused(parameter: ISearchParameter): boolean {
        return !parameter.used;
    }

    public addSearchParam(parameter: ISearchParameter, value: any, enterEditModel: boolean): void {
        if (enterEditModel === undefined) {
            enterEditModel = true;
        }

        if (!this.isUnused(parameter)) {
            return;
        }

        let defaultPropertiesForSearchParam: ISearchParameter = {
            key: '', name: '', type: 'text', placeholder: '', hint: '', autocomplete: false, value: ''
        };

        let newIndex: number = this.usedParameters.push(_.extend({}, defaultPropertiesForSearchParam, parameter)) - 1;
        this.updateModel('add', parameter.key, value);

        if (enterEditModel === true) {
            this.$timeout((): void => {
                this.enterEditMode(undefined, newIndex);
            }, 100);
        }
    }

    public removeSearchParam(index: number): void {
        if (index !== undefined && index >= 0) {
            let searchParam: ISearchParameter = this.usedParameters[index];
            this.usedParameters.splice(index, 1);
            this.updateModel('delete', searchParam.key, undefined);
        }
    }

    public removeAll(): void {
        _.each(this.availableParameters, (parameter: ISearchParameter): void => {
            parameter.used = false;
        });
        this.usedParameters.length = 0;
        this.searchQuery = '';
        this.model = {};
    }

    public editPrevious(currentIndex: number): void {
        if (currentIndex !== undefined) {
            this.leaveEditMode(currentIndex);
        }

        if (currentIndex > 0) {
            this.enterEditMode(undefined, currentIndex - 1);
        } else if (currentIndex === 0) {
            this.searchFocus = true;
        } else if (this.usedParameters.length > 0) {
            this.enterEditMode(undefined, this.usedParameters.length - 1);
        }
    }

    public editNext(currentIndex: number): void {
        if (currentIndex !== undefined) {
            this.leaveEditMode(currentIndex);
            if (currentIndex < this.usedParameters.length - 1) {
                this.enterEditMode(undefined, currentIndex + 1);
            } else {
                this.searchFocus = true;
            }
        }
    }

    public keydown(event: KeyboardEvent, searchParamIndex: number): void {
        let handledKeys: Array<number> = [8, 9, 13, 37, 39];
        if (handledKeys.indexOf(event.which) === -1) {
            return;
        }

        let cursorPosition: number = BasicSearchController.getCurrentCaretPosition(event.target);

        if (event.which === 8) { // backspace
            if (cursorPosition === 0) {
                event.preventDefault();
                this.editPrevious(searchParamIndex);
            }
        } else if (event.which === 9) { // tab
            if (event.shiftKey) {      // with shift
                event.preventDefault();
                this.editPrevious(searchParamIndex);
            } else {               // without shift
                event.preventDefault();
                this.editNext(searchParamIndex);
            }
        } else if (event.which === 13) { // enter
            this.editNext(searchParamIndex);
        } else if (event.which === 37) { // left
            if (cursorPosition === 0) {
                this.editPrevious(searchParamIndex);
            }
        } else if (event.which === 39) { // right
            if (cursorPosition === (<HTMLInputElement> event.target).value.length) {
                this.editNext(searchParamIndex);
            }
        }
    };

    public updateModel(command: string, key: string, value: any): void {
        if (key === 'query') {
            if (command === 'delete') {
                this.searchQuery = '';
            } else {
                this.searchQuery = value;
            }
        } else {
            let parameterTemplate: ISearchParameter = _.findWhere(this.availableParameters, {key: key});
            if (command === 'delete') {
                parameterTemplate.used = false;
                delete this.model[key];
                let index: number = _.findIndex(this.usedParameters, (param: ISearchParameter): boolean => {
                    return param.key === key;
                });
                this.removeSearchParam(index);
            } else {
                let parameter: ISearchParameter = _.findWhere(this.usedParameters, {key: key});
                parameterTemplate.used = true;

                // check if the value comes from the autocomplete directive
                if (parameterTemplate.autocomplete && value && value.id) {
                    this.model[key] = value.id;
                    parameter.value = value.name;
                } else {
                    this.model[key] = value;
                    parameter.value = value;
                }
            }
        }
    }

    public getAutocompleteValues(searchParam: ISearchParameter, query: string): angular.IPromise<any[]> | any[] {
        if (searchParam.autocomplete) {
            return this.searchService.getAutocompleteValues(searchParam, query)
                .then((response: angular.IHttpPromiseCallbackArg<any>): Array<any> => {
                    return _.first(response.data, 25);
                });
        }
        return [];
    }

}

/**
 * Example of a service responsible for search widget initialization and getting the search results.
 * @author mc
 */
export class SearchService {
    public static $inject: string[] = ['$http'];

    constructor(private $http: angular.IHttpService) {
    }

    private static _AUTOCOMPLETE_URL: string = '/api/search/autocomplete';

    public getAutocompleteValues(searchParam: any, query: string): angular.IPromise<Array<any>> {
        return this.$http({
            method: 'GET',
            params: {
                parameterKey: searchParam.key,
                value: query
            },
            url: SearchService._AUTOCOMPLETE_URL
        });
    }
}


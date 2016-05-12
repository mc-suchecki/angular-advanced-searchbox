/**
 * Represents a search parameter - used in the BasicSearchComponent.
 * @author msucheck
 */
export interface ISearchParameter {
    /** Identifier of the parameter. */
    key: string;

    /** Name of the parameter - it is displayed in the search widget. */
    name: string;

    /** HTML input type for the parameter. Defaults to 'text'. */
    type?: string;

    /** Placeholder for the input field. Defaults to empty. */
    placeholder?: string;

    /** Text to display in the tooltip, when the user hovers the parameter. Defaults to empty. */
    hint?: string;

    /** Tells the widget if there should be autocomplete in that field. Defaults to false. */
    autocomplete?: boolean;

    // all of the above are added by the widget later
    editMode?: boolean;
    value?: any;
    used?: boolean;
}

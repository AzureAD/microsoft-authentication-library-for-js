# Issue Template Bot

## About

The issue template bot can help manage issues opened on a github repository. The bot runs every time an issue is opened or the original post is edited.

### Template Enforcement

If an issue was not created using one of the provided templates or does not contain user entered information under each required section the bot can take one or more of the following actions:

- Add a label
- Leave a custom comment
- Close the issue

When an issue is updated and has now filled out all required sections the bot will do the following things:

- Remove the label
- Remove the comment


### Checkbox Selections

If your issue template makes use of checkbox selections the bot can also take one or more of the following actions based on selections made:

- Add labels
- Add issue to project boards
- Assign users to issue
- Leave a custom comment if selection was not made

If a previously checked selection is unchecked the bot will take the following actions: 

- Remove labels
- Remove from project boards

## How it works

## Configuration

The bot is configured via a json file located [here](#.github/issue_template_bot.json)

Schema:
```javascript
{
    "selectors": {
        // Can include one or more headers
        "replace_this_with_header_name": {
            "labels": {
                // Can include one or more label
                "replace_this_with_label_name": {
                    "searchStrings": Array<string>,
                    "assignees": Array<string>,
                    "project": {
                        "name": string,
                        "column": string
                    }
                }
            }
        },
    },
    "enforceTemplate": boolean,
    "ignoreIssuesOpenedBefore"?: string,
    "templateEnforcementLabel"?: string,
    "incompleteTemplateMessage"?: string,
    "noTemplateMessage"?: string,
    "noTemplateClose"?: boolean
}
```

### Top Level Config

| Config Key                  | Description                                                                               |
|-----------------------------|-------------------------------------------------------------------------------------------|
| `selectors`                 | Configuration for checkbox selections (See [below](#selector-config))                     |
| `ignoreIssuesOpenedBefore`  | String date. Issues created before this date will be ignored                              |
| `enforceTemplate`           | When set to true the issue content will be compared to issue templates                    |
| `templateEnforcementLabel`  | Label to add to issues that fail template enforcement                                     |
| `incompleteTemplateMessage` | Comment to leave on issues that use a template but did not complete all required sections |
| `noTemplateMessage`         | Comment to leave on issues that did not use a template                                    |
| `noTemplateClose`           | When set to true bot will close issues that did not use a template                        |

### Selector Config

The selector config can contain one or more key value pairs where the key is the header name to apply the config to. 

| Config Key         | Description                                                                                     |
|--------------------|-------------------------------------------------------------------------------------------------|
| `label`            | Configuration for one or more specific selections under the header (See [below](#label-config)) |

### Label Config

The label config can contain one or more key value pairs where the key is the label name to add to issues that match the provided criteria

| Config Key         | Description                                                                                                      |
|--------------------|------------------------------------------------------------------------------------------------------------------|
| `searchStrings`    | If a checked checkbox contains any of the provided values in the same line, apply label and below config options |
| `assignees`        | Github usernames to assign to this issue                                                                         |
| `project`          | Project board to add this issue to (See [below](#project-config))                                                |

### Project Config

| Config Key | Description                                            |
|------------|--------------------------------------------------------|
| `name`     | Name of the project to add this issue to               |
| `column`   | Name of the column on the project to add this issue to |
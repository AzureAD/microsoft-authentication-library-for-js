module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow calling class methods from within the constructor",
            category: "Best Practices",
            recommended: true
        },
        schema: [] // no options
    },
    create(context) {
        return {
            MethodDefinition(node) {
                if (node.kind === "constructor") {
                    node.value.body.body.forEach(statement => {
                        if (statement.type !== "ExpressionStatement") {
                            return;
                        }

                        if (statement.expression.type === "CallExpression" &&
                            statement.expression.callee.type === "MemberExpression" &&
                            statement.expression.callee.object.type === "ThisExpression") {
                                context.report({
                                    node: statement,
                                    message: "Calling class methods from within the constructor is not allowed."
                                });
                        } else if (statement.expression.type === "AssignmentExpression" &&
                                   statement.expression.right.type === "CallExpression" &&
                                   statement.expression.right.callee.type === "MemberExpression" &&
                                   statement.expression.right.callee.object.type === "ThisExpression") {
                                context.report({
                                    node: statement,
                                    message: "Calling class methods from within the constructor is not allowed."
                                });
                        } else if (statement.expression.type === "CallExpression" &&
                                   statement.expression.arguments.some(arg => 
                                       arg.type === "CallExpression" &&
                                       arg.callee.type === "MemberExpression" &&
                                       arg.callee.object.type === "ThisExpression")) {
                                context.report({
                                    node: statement,
                                    message: "Calling class methods from within the constructor is not allowed."
                                });
                        }
                    });
                }
            }
        };
    }
}
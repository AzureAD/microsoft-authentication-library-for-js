/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

type FaaCFunction = <T>(args: T) => React.ReactNode;

export function getChildrenOrFunction<T>(
    children: React.ReactNode | FaaCFunction,
    args: T
): React.ReactNode {
    if (typeof children === "function") {
        return children(args);
    }
    return children;
}

/*
 * Utility types
 * Reference: https://github.com/piotrwitek/utility-types
 */
type SetDifference<A, B> = A extends B ? never : A;
type SetComplement<A, A1 extends A> = SetDifference<A, A1>;
export type Subtract<T extends T1, T1 extends object> = Pick<T,SetComplement<keyof T, keyof T1>>;

/**
 * Helper function to determine whether 2 arrays are equal
 * Used to avoid unnecessary state updates
 * @param arrayA 
 * @param arrayB 
 */
export function arraysAreEqual(arrayA: Array<object>, arrayB: Array<object>) {
    if (arrayA.length !== arrayB.length) {
        return false;
    }

    return arrayA.every((element, index) => {
        return JSON.stringify(element) === JSON.stringify(arrayB[index]);
    });
}

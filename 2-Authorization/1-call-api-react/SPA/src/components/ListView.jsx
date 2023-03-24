import React, { useState, useRef, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { customAlphabet } from 'nanoid';
import ListGroup from "react-bootstrap/ListGroup";

import { TodoForm } from "./TodoForm";
import { TodoItem } from "./TodoItem";

import useFetchWithMsal from '../hooks/useFetchWithMsal';
import { protectedResources } from "../authConfig";

function usePrevious(value) {
    const ref = useRef();

    useEffect(() => {
        ref.current = value;
    });

    return ref.current;
}

export const ListView = (props) => {

    const { instance } = useMsal();
    const account = instance.getActiveAccount();

    const { error, execute } = useFetchWithMsal({
        scopes: protectedResources.apiTodoList.scopes.write
    });

    const [tasks, setTasks] = useState(props.todoListData);

    const handleCompleteTask = (id) => {
        const updatedTask = tasks.find(task => id === task.id);
        updatedTask.status = !updatedTask.status;

        execute("PUT", protectedResources.apiTodoList.endpoint + `/${id}`, updatedTask).then(() => {
            const updatedTasks = tasks.map(task => {
                if (id === task.id) {
                    return { ...task, status: !task.status };
                }
                return task;
            });
            setTasks(updatedTasks);
        });
    }

    const handleAddTask = (description) => {
        const nanoid = customAlphabet('1234567890', 6);
        const newTask = {
            owner: account.idTokenClaims?.oid,
            id: Number(nanoid(6)),
            description: description,
            status: false,
        };

        execute('POST', protectedResources.apiTodoList.endpoint, newTask).then((response) => {
            if (response) {
                setTasks([...tasks, newTask]);
            }
        });
    };

    const handleDeleteTask = (id) => {
        execute("DELETE", protectedResources.apiTodoList.endpoint + `/${id}`).then((response) => {
            if (response.status === 200 || response.status === 204) {
                const remainingTasks = tasks.filter(task => id !== task.id);
                setTasks(remainingTasks);
            }
        });
    }

    const handleEditTask = (id, description) => {
        const updatedTask = tasks.find((task) => id === task.id);
        updatedTask.description = description;

        execute('PUT', protectedResources.apiTodoList.endpoint + `/${id}`, updatedTask).then(() => {
            const updatedTasks = tasks.map((task) => {
                if (id === task.id) {
                    return { ...task, description: description };
                }
                return task;
            });
            setTasks(updatedTasks);
        });
    };

    const taskList = tasks.map((task) => (
        <TodoItem
            id={task.id}
            description={task.description}
            status={task.status}
            key={task.id}
            completeTask={handleCompleteTask}
            deleteTask={handleDeleteTask}
            editTask={handleEditTask}
        />
    ));

    const listHeadingRef = useRef(null);
    const prevTaskLength = usePrevious(tasks.length);

    useEffect(() => {
        if (tasks.length - prevTaskLength === -1) {
            listHeadingRef.current.focus();
        }
    }, [tasks.length, prevTaskLength]);

    if (error) {
        return <div>Error: {error.message}</div>;
    }
    
    return (
        <div className="data-area-div">
            <TodoForm addTask={handleAddTask} />
            <h2 id="list-heading" tabIndex="-1" ref={listHeadingRef}>{""}</h2>
            <ListGroup className="todo-list">
                {taskList}
            </ListGroup>
        </div>
    );
}

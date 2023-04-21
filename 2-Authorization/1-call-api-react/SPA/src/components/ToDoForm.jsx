import React, { useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap"; 

export const ToDoForm = (props) => {
    const [description, setDescription] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!description.trim()) {
            return;
        }

        props.addTask(description);
        setDescription('');
    }

    const handleChange = (e) => {
        setDescription(e.target.value);
    }

    return (
        <Form className="todo-form" onSubmit={handleSubmit}>
            <Form.Group>
                <InputGroup className="mb-7">
                    <Form.Control
                        type="text"
                        id="new-todo-input"
                        name="text"
                        autoComplete="off"
                        value={description}
                        onChange={handleChange}
                        placeholder="Enter a task"
                    />
                    <Button variant="primary" type="submit">
                        Add
                    </Button>
                </InputGroup>
            </Form.Group>
        </Form>
    );
}

import { useEffect, useState } from "react";

import { TextInput } from "./TextInput";

type NotesInputProps = {
    value?: string;
    onSave: (value: string) => void;
    minWidth?: number;
};

export const NotesInput = (props: NotesInputProps) => {
    const { value = "", onSave, minWidth = 200 } = props;

    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <TextInput
            value={localValue}
            minWidth={minWidth}
            onChange={(newValue) => {
                setLocalValue(newValue);
            }}
            onBlur={() => {
                if (localValue !== value) {
                    onSave(localValue);
                }
            }}
        />
    );
};
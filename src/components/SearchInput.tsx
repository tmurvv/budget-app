import { TextInput } from "./TextInput";

type SearchInputProps = {
    value: string;
    onChange: (value: string) => void;
    label?: string;
};

export const SearchInput = (props: SearchInputProps) => {
    const { value, onChange, label = "Search description" } = props;

    return (
        <TextInput
            label={label}
            value={value}
            minWidth={300}
            onChange={onChange}
        />
    );
};
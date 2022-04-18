export default function reninPlugin(): {
    name: string;
    transform(src: string, filepath: string): {
        code: string;
    };
};

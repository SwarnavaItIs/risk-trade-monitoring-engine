import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const AIFormattedOutput = ({ content }) => {
    if (!content) {
        return null;
    }

    return (
        <div className="text-sm leading-7 text-slate-800 dark:text-slate-100">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1 className="mb-5 text-2xl font-bold text-slate-900 dark:text-white">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="mb-3 mt-6 text-xl font-bold text-indigo-700 dark:text-indigo-300">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="mb-2 mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                            {children}
                        </h3>
                    ),
                    p: ({ children }) => (
                        <p className="mb-3 text-slate-700 dark:text-slate-200">
                            {children}
                        </p>
                    ),
                    ul: ({ children }) => (
                        <ul className="mb-4 ml-6 list-disc space-y-2">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="mb-4 ml-6 list-decimal space-y-2">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="text-slate-700 dark:text-slate-200">
                            {children}
                        </li>
                    ),
                    strong: ({ children }) => (
                        <strong className="font-bold text-slate-900 dark:text-white">
                            {children}
                        </strong>
                    ),
                    code: ({ children, className }) => {
                        const isCodeBlock = className?.startsWith("language-");

                        if (!isCodeBlock) {
                            return (
                                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                                    {children}
                                </code>
                            );
                        }

                        return (
                            <code className="block overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children }) => (
                        <pre className="my-4 overflow-x-auto rounded-lg bg-slate-950 p-4">
                            {children}
                        </pre>
                    ),
                    table: ({ children }) => (
                        <div className="my-4 overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="border border-slate-300 bg-slate-100 px-3 py-2 font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-slate-300 px-3 py-2 text-slate-700 dark:border-slate-700 dark:text-slate-200">
                            {children}
                        </td>
                    )
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default AIFormattedOutput;

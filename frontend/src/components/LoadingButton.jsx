const LoadingButton = ({ text = "Processing..." }) => {
    return (
        <button 
            type="button"
            className="inline-flex items-center rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-80"
            disabled
        >
            <svg
                className="mr-3 size-5 animate-spin text-white"
                viewBox="0 0 24 24"
                fill="none"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />

                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
            </svg>

            {text}
        </button>
    );
};

export default LoadingButton;
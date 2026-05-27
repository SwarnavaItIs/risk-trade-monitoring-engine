import {useParams} from 'react-router-dom';

const AlertDetails = () => {
    const {id} = useParams();

    return (
        <div className="page">
            <h1>Alert Details</h1>
            <p>Details for alert ID: {id} will appear here.</p>
        </div>
    );
};

export default AlertDetails;
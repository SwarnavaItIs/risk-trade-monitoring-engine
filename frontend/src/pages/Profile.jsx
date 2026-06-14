import { useEffect, useState } from "react";
import { getMe } from "../api/api";

import LoadingButton from "../components/LoadingButton";

const Profile = () => {
    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem("user"))
    );

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchProfile = async () => {
        try {
            setLoading(true);

            const response = await getMe();

            setUser(response.data.data.user);
            localStorage.setItem(
                "user",
                JSON.stringify(response.data.data.user)
            );

            setError("");
        }
        catch (err) {
            setError("Failed to load profile");
            console.log(err);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchProfile();
    }, []);

    const getInitial = () => {
        return user?.name?.charAt(0)?.toUpperCase() || "U";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 p-8">
                <div className="flex min-h-[60vh] items-center justify-center">
                    <LoadingButton text="Loading profile..." />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-100 p-8">
                <p className="font-semibold text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow">
                <div className="flex flex-col items-center text-center">
                    {user?.profilePhoto ? (
                        <img
                            src={user.profilePhoto}
                            alt={user.name}
                            className="size-28 rounded-full border-4 border-indigo-100 object-cover shadow"
                        />
                    ) : (
                        <div className="flex size-28 items-center justify-center rounded-full bg-indigo-600 text-4xl font-bold text-white shadow">
                            {getInitial()}
                        </div>
                    )}

                    <h1 className="mt-5 text-3xl font-bold text-slate-900">
                        {user?.name}
                    </h1>

                    <p className="mt-1 text-slate-600">
                        {user?.email}
                    </p>

                    <span className="mt-4 rounded-full bg-slate-900 px-4 py-1 text-sm font-semibold text-white">
                        {user?.role}
                    </span>
                </div>

                <div className="mt-8 space-y-4 rounded-xl bg-slate-50 p-5">
                    <div className="flex justify-between">
                        <span className="font-medium text-slate-600">
                            Name
                        </span>
                        <span className="font-semibold text-slate-900">
                            {user?.name}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="font-medium text-slate-600">
                            Email
                        </span>
                        <span className="font-semibold text-slate-900">
                            {user?.email}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="font-medium text-slate-600">
                            Role
                        </span>
                        <span className="font-semibold text-slate-900">
                            {user?.role}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { toast } from "react-toastify";
import { setDoc, doc } from "firebase/firestore";

function SignInwithGoogle() {
  function googleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).then(async (result) => {
      console.log(result);
      const user = result.user;
      if (result.user) {
        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: user.displayName,
          photo: user.photoURL,
          lastName: "",
        });
        toast.success("User logged in Successfully", {
          position: "top-center",
        });
        window.location.href = "/profile";
      }
    });
  }
  return (
    <div>
      <div
        style={{ display: "flex", justifyContent: "center", cursor: "pointer", padding: "10px", backgroundColor: "#4285F4", color: "white", borderRadius: "5px" }}
        onClick={googleLogin}
      >Login with Google
      </div>
    </div>
  );
}
export default SignInwithGoogle;
package calendarvision.loadingscreen;

import android.content.Intent;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;

import static android.R.attr.value;

public class Main extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Button nextButton = (Button)findViewById(R.id.nextButton);

        nextButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent myIntent = new Intent(Main.this, LoadingScreen.class);
                myIntent.putExtra("key", value); //Optional parameters
                Main.this.startActivity(myIntent);
            }
        });
    }

}
